const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Database setup
const db = new Database('game.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT DEFAULT 'waiting',
    round INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Game state
let gameState = {
  players: new Map(), // socketId -> {nick, role, alive, voted}
  phase: 'waiting', // waiting, night, day, voting, ended
  round: 0,
  nightActions: {
    kill: null,
    save: null,
    investigate: null
  },
  votes: new Map(),
  hasVotingStarted: false
};

// Serve static files
app.use(express.static('public'));

// Game logic functions
function assignRoles(playerCount) {
  const roles = ['cidadao'];
  
  if (playerCount >= 3) {
    roles.push('assassino');
  }
  if (playerCount >= 5) {
    roles.push('anjo');
  }
  if (playerCount >= 6) {
    roles.push('detetive');
  }
  
  // Fill rest with citizens
  while (roles.length < playerCount) {
    roles.push('cidadao');
  }
  
  // Shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  
  return roles;
}

function getAlivePlayers() {
  return Array.from(gameState.players.values()).filter(p => p.alive);
}

function checkWinCondition() {
  const alive = getAlivePlayers();
  const assassin = alive.find(p => p.role === 'assassino');
  const citizens = alive.filter(p => p.role !== 'assassino');
  
  if (!assassin) {
    return 'citizens';
  }
  if (citizens.length <= 1) {
    return 'assassin';
  }
  return null;
}

function resetNightActions() {
  gameState.nightActions = {
    kill: null,
    save: null,
    investigate: null
  };
}

function startGame() {
  if (gameState.players.size < 3) {
    io.emit('error', { message: 'Mínimo 3 jogadores para começar' });
    return;
  }
  
  const roles = assignRoles(gameState.players.size);
  let index = 0;
  
  gameState.players.forEach((player, socketId) => {
    player.role = roles[index++];
    player.alive = true;
    player.voted = false;
  });
  
  gameState.phase = 'night';
  gameState.round = 1;
  gameState.hasVotingStarted = false;
  resetNightActions();
  
  // Send roles to players
  gameState.players.forEach((player, socketId) => {
    io.to(socketId).emit('roleAssigned', { role: player.role });
  });
  
  broadcastGameState();
  io.emit('phaseChange', { phase: 'night', round: 1, message: '🌙 A cidade dorme... Jogadores especiais, façam suas ações!' });
}

function processNightPhase() {
  const hasAssassin = Array.from(gameState.players.values()).some(p => p.role === 'assassino' && p.alive);
  const hasAnjo = Array.from(gameState.players.values()).some(p => p.role === 'anjo' && p.alive);
  const hasDetetive = Array.from(gameState.players.values()).some(p => p.role === 'detetive' && p.alive);
  
  const requiredActions = hasAssassin ? 1 : 0;
  const optionalActions = (hasAnjo ? 1 : 0) + (hasDetetive ? 1 : 0);
  
  const completedActions = 
    (gameState.nightActions.kill !== null ? 1 : 0) +
    (hasAnjo && gameState.nightActions.save !== null ? 1 : 0) +
    (hasDetetive && gameState.nightActions.investigate !== null ? 1 : 0);
  
  // Night ends when assassin acted (and others if they exist)
  if (hasAssassin && gameState.nightActions.kill === null) return;
  
  // Process results
  const killed = gameState.nightActions.kill;
  const saved = gameState.nightActions.save;
  const investigated = gameState.nightActions.investigate;
  
  let message = '☀️ A cidade acorda!\n\n';
  let deaths = [];
  
  if (killed && killed !== saved) {
    const victim = Array.from(gameState.players.entries()).find(([_, p]) => p.nick === killed);
    if (victim) {
      victim[1].alive = false;
      deaths.push(killed);
      message += `💀 ${killed} foi morto(a) durante a noite!\n`;
    }
  } else if (killed && killed === saved) {
    message += `✨ O anjo salvou ${killed}!\n`;
  } else if (!killed) {
    message += `😴 Ninguém morreu esta noite.\n`;
  }
  
  if (investigated && hasDetetive) {
    const target = Array.from(gameState.players.values()).find(p => p.nick === investigated);
    const detective = Array.from(gameState.players.entries()).find(([_, p]) => p.role === 'detetive');
    
    if (target && detective) {
      const isAssassin = target.role === 'assassino';
      const result = isAssassin ? 'SIM, é o assassino!' : 'NÃO é o assassino.';
      io.to(detective[0]).emit('investigationResult', { 
        target: investigated, 
        isAssassin,
        message: `🔍 Investigação: ${investigated} - ${result}`
      });
    }
  }
  
  const winner = checkWinCondition();
  if (winner) {
    endGame(winner);
    return;
  }
  
  gameState.phase = gameState.round > 1 || deaths.length > 0 ? 'voting' : 'day';
  gameState.votes.clear();
  gameState.players.forEach(p => p.voted = false);
  
  broadcastGameState();
  io.emit('phaseChange', { 
    phase: gameState.phase, 
    round: gameState.round,
    message,
    canVote: gameState.phase === 'voting'
  });
}

function processVoting() {
  const alivePlayers = getAlivePlayers();
  const allVoted = alivePlayers.every(p => p.voted);
  
  if (!allVoted) return;
  
  // Count votes
  const voteCounts = new Map();
  gameState.votes.forEach((target) => {
    voteCounts.set(target, (voteCounts.get(target) || 0) + 1);
  });
  
  let maxVotes = 0;
  let eliminated = null;
  
  voteCounts.forEach((count, player) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = player;
    }
  });
  
  let message = '📊 Resultado da votação:\n\n';
  
  voteCounts.forEach((count, player) => {
    message += `${player}: ${count} voto(s)\n`;
  });
  
  if (eliminated) {
    const victim = Array.from(gameState.players.entries()).find(([_, p]) => p.nick === eliminated);
    if (victim) {
      victim[1].alive = false;
      message += `\n⚖️ ${eliminated} foi eliminado(a) pela votação!`;
      
      const winner = checkWinCondition();
      if (winner) {
        io.emit('votingResult', { message });
        setTimeout(() => endGame(winner), 3000);
        return;
      }
    }
  } else {
    message += '\n🤝 Empate! Ninguém foi eliminado.';
  }
  
  gameState.round++;
  gameState.phase = 'night';
  gameState.votes.clear();
  gameState.players.forEach(p => p.voted = false);
  resetNightActions();
  
  io.emit('votingResult', { message });
  
  setTimeout(() => {
    broadcastGameState();
    io.emit('phaseChange', { 
      phase: 'night', 
      round: gameState.round,
      message: `🌙 Noite ${gameState.round}... A cidade dorme novamente.` 
    });
  }, 5000);
}

function endGame(winner) {
  gameState.phase = 'ended';
  
  const roles = {};
  gameState.players.forEach((player) => {
    roles[player.nick] = player.role;
  });
  
  const message = winner === 'citizens' 
    ? '🎉 Os cidadãos venceram! O assassino foi eliminado!' 
    : '😈 O assassino venceu! A cidade foi dominada!';
  
  io.emit('gameEnd', { winner, message, roles });
}

function broadcastGameState() {
  const players = Array.from(gameState.players.values()).map(p => ({
    nick: p.nick,
    alive: p.alive,
    voted: p.voted
  }));
  
  io.emit('gameState', {
    players,
    phase: gameState.phase,
    round: gameState.round,
    playerCount: players.length,
    aliveCount: players.filter(p => p.alive).length
  });
}

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('joinGame', (data) => {
    const { nick } = data;
    
    if (!nick || nick.trim().length === 0) {
      socket.emit('error', { message: 'Nick inválido' });
      return;
    }
    
    // Check if nick already exists
    const nickExists = Array.from(gameState.players.values()).some(p => p.nick === nick);
    if (nickExists) {
      socket.emit('error', { message: 'Nick já está em uso' });
      return;
    }
    
    if (gameState.phase !== 'waiting') {
      socket.emit('error', { message: 'Jogo já começou' });
      return;
    }
    
    gameState.players.set(socket.id, {
      nick: nick.trim(),
      role: null,
      alive: true,
      voted: false
    });
    
    socket.emit('joinedGame', { nick: nick.trim() });
    broadcastGameState();
    io.emit('playerJoined', { nick: nick.trim(), count: gameState.players.size });
  });
  
  socket.on('startGame', () => {
    if (gameState.phase === 'waiting') {
      startGame();
    }
  });
  
  socket.on('nightAction', (data) => {
    if (gameState.phase !== 'night') return;
    
    const player = gameState.players.get(socket.id);
    if (!player || !player.alive) return;
    
    const { action, target } = data;
    
    if (action === 'kill' && player.role === 'assassino') {
      gameState.nightActions.kill = target;
    } else if (action === 'save' && player.role === 'anjo') {
      gameState.nightActions.save = target;
    } else if (action === 'investigate' && player.role === 'detetive') {
      gameState.nightActions.investigate = target;
    }
    
    socket.emit('actionConfirmed', { action, target });
    processNightPhase();
  });
  
  socket.on('vote', (data) => {
    if (gameState.phase !== 'voting') return;
    
    const player = gameState.players.get(socket.id);
    if (!player || !player.alive || player.voted) return;
    
    const { target } = data;
    const targetPlayer = Array.from(gameState.players.values()).find(p => p.nick === target && p.alive);
    
    if (!targetPlayer) return;
    
    gameState.votes.set(socket.id, target);
    player.voted = true;
    
    socket.emit('voteConfirmed', { target });
    broadcastGameState();
    
    processVoting();
  });
  
  socket.on('chatMessage', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;
    
    const { message } = data;
    io.emit('chatMessage', { 
      nick: player.nick, 
      message: message.trim(),
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      gameState.players.delete(socket.id);
      io.emit('playerLeft', { nick: player.nick, count: gameState.players.size });
      broadcastGameState();
      
      // Reset game if in waiting phase
      if (gameState.phase === 'waiting' && gameState.players.size === 0) {
        gameState = {
          players: new Map(),
          phase: 'waiting',
          round: 0,
          nightActions: { kill: null, save: null, investigate: null },
          votes: new Map(),
          hasVotingStarted: false
        };
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🎮 Servidor Cidade Dorme rodando na porta ${PORT}`);
});
