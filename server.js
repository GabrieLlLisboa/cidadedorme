const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Estado do jogo em memória
const rooms = new Map();

// Configurações
const ROLES = {
  ASSASSINO: 'assassino',
  DETETIVE: 'detetive',
  ANJO: 'anjo',
  CIDADAO: 'cidadao'
};

const GAME_STATES = {
  LOBBY: 'lobby',
  NIGHT: 'night',
  DAY: 'day',
  VOTING: 'voting',
  GAME_OVER: 'game_over'
};

// Gerar código único de sala
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Distribuir papéis aleatoriamente
function distributeRoles(players, roleConfig) {
  const roles = [];
  
  // Adicionar papéis conforme configuração
  for (let i = 0; i < roleConfig.assassino; i++) roles.push(ROLES.ASSASSINO);
  for (let i = 0; i < roleConfig.detetive; i++) roles.push(ROLES.DETETIVE);
  for (let i = 0; i < roleConfig.anjo; i++) roles.push(ROLES.ANJO);
  
  // Preencher restante com cidadãos
  const totalSpecialRoles = roleConfig.assassino + roleConfig.detetive + roleConfig.anjo;
  const cidadaosNeeded = players.length - totalSpecialRoles;
  for (let i = 0; i < cidadaosNeeded; i++) roles.push(ROLES.CIDADAO);
  
  // Embaralhar
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  
  return roles;
}

// Verificar condições de vitória
function checkWinCondition(room) {
  const alivePlayers = room.players.filter(p => p.isAlive);
  const aliveAssassins = alivePlayers.filter(p => p.role === ROLES.ASSASSINO);
  const aliveCitizens = alivePlayers.filter(p => p.role !== ROLES.ASSASSINO);
  
  if (aliveAssassins.length === 0) {
    return { winner: 'cidade', message: 'A Cidade venceu! Todos os assassinos foram eliminados.' };
  }
  
  if (aliveAssassins.length >= aliveCitizens.length) {
    return { winner: 'assassinos', message: 'Os Assassinos venceram! Eles tomaram o controle da cidade.' };
  }
  
  return null;
}

// Socket.io
io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);
  
  // Criar sala
  socket.on('create_room', (data) => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      host: socket.id,
      players: [{
        id: socket.id,
        name: data.playerName,
        role: null,
        isAlive: true,
        isReady: false,
        hasVoted: false,
        hasActed: false
      }],
      state: GAME_STATES.LOBBY,
      roleConfig: {
        assassino: 1,
        detetive: 1,
        anjo: 1
      },
      nightActions: {},
      votes: {},
      dayTimer: 60,
      nightTimer: 30,
      chatEnabled: true,
      currentDay: 0,
      history: []
    };
    
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('room_created', { roomCode, room });
    console.log('Sala criada:', roomCode);
  });
  
  // Entrar na sala
  socket.on('join_room', (data) => {
    const room = rooms.get(data.roomCode);
    
    if (!room) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }
    
    if (room.state !== GAME_STATES.LOBBY) {
      socket.emit('error', { message: 'O jogo já começou' });
      return;
    }
    
    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (!existingPlayer) {
      room.players.push({
        id: socket.id,
        name: data.playerName,
        role: null,
        isAlive: true,
        isReady: false,
        hasVoted: false,
        hasActed: false
      });
    }
    
    socket.join(data.roomCode);
    io.to(data.roomCode).emit('room_updated', { room });
    console.log(`${data.playerName} entrou na sala ${data.roomCode}`);
  });
  
  // Atualizar configuração de papéis
  socket.on('update_roles', (data) => {
    const room = rooms.get(data.roomCode);
    
    if (!room || room.host !== socket.id) {
      socket.emit('error', { message: 'Apenas o host pode alterar configurações' });
      return;
    }
    
    room.roleConfig = data.roleConfig;
    io.to(data.roomCode).emit('room_updated', { room });
  });
  
  // Iniciar jogo
  socket.on('start_game', (data) => {
    const room = rooms.get(data.roomCode);
    
    if (!room || room.host !== socket.id) {
      socket.emit('error', { message: 'Apenas o host pode iniciar o jogo' });
      return;
    }
    
    const totalRoles = room.roleConfig.assassino + room.roleConfig.detetive + room.roleConfig.anjo;
    if (room.players.length < totalRoles + 1) {
      socket.emit('error', { 
        message: `Jogadores insuficientes. Necessário pelo menos ${totalRoles + 1} jogadores.` 
      });
      return;
    }
    
    // Distribuir papéis
    const roles = distributeRoles(room.players, room.roleConfig);
    room.players.forEach((player, index) => {
      player.role = roles[index];
      player.isAlive = true;
      
      // Enviar papel secreto para cada jogador
      io.to(player.id).emit('role_assigned', { 
        role: player.role,
        roleDescription: getRoleDescription(player.role)
      });
    });
    
    room.state = GAME_STATES.NIGHT;
    room.currentDay = 1;
    room.nightActions = {};
    
    io.to(data.roomCode).emit('game_started', { room });
    io.to(data.roomCode).emit('phase_change', { 
      phase: GAME_STATES.NIGHT,
      day: room.currentDay
    });
    
    console.log(`Jogo iniciado na sala ${data.roomCode}`);
  });
  
  // Ação noturna
  socket.on('night_action', (data) => {
    const room = rooms.get(data.roomCode);
    
    if (!room || room.state !== GAME_STATES.NIGHT) {
      socket.emit('error', { message: 'Ações noturnas só podem ser feitas à noite' });
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    
    if (!player || !player.isAlive) {
      socket.emit('error', { message: 'Você não pode agir' });
      return;
    }
    
    if (player.hasActed) {
      socket.emit('error', { message: 'Você já realizou sua ação esta noite' });
      return;
    }
    
    room.nightActions[player.role] = {
      playerId: socket.id,
      targetId: data.targetId
    };
    
    player.hasActed = true;
    socket.emit('action_confirmed', { message: 'Ação realizada' });
    
    // Verificar se todos agiram
    const aliveSpecialRoles = room.players.filter(p => 
      p.isAlive && [ROLES.ASSASSINO, ROLES.DETETIVE, ROLES.ANJO].includes(p.role)
    );
    
    const actedPlayers = aliveSpecialRoles.filter(p => p.hasActed);
    
    if (actedPlayers.length === aliveSpecialRoles.length) {
      resolveNight(room, data.roomCode);
    }
  });
  
  // Votar
  socket.on('vote', (data) => {
    const room = rooms.get(data.roomCode);
    
    if (!room || room.state !== GAME_STATES.VOTING) {
      socket.emit('error', { message: 'Votação não está aberta' });
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    
    if (!player || !player.isAlive) {
      socket.emit('error', { message: 'Você não pode votar' });
      return;
    }
    
    if (player.hasVoted) {
      socket.emit('error', { message: 'Você já votou' });
      return;
    }
    
    room.votes[socket.id] = data.targetId;
    player.hasVoted = true;
    
    socket.emit('vote_confirmed', { message: 'Voto registrado' });
    
    // Verificar se todos votaram
    const alivePlayers = room.players.filter(p => p.isAlive);
    const votedPlayers = alivePlayers.filter(p => p.hasVoted);
    
    if (votedPlayers.length === alivePlayers.length) {
      resolveVoting(room, data.roomCode);
    } else {
      io.to(data.roomCode).emit('vote_update', {
        votesCount: votedPlayers.length,
        totalVotes: alivePlayers.length
      });
    }
  });
  
  // Chat
  socket.on('send_message', (data) => {
    const room = rooms.get(data.roomCode);
    
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    
    if (!player) return;
    
    // Apenas jogadores vivos podem falar durante o dia
    if (room.state === GAME_STATES.DAY && !player.isAlive) {
      socket.emit('error', { message: 'Jogadores mortos não podem falar' });
      return;
    }
    
    io.to(data.roomCode).emit('new_message', {
      playerName: player.name,
      message: data.message,
      timestamp: Date.now(),
      isAlive: player.isAlive
    });
  });
  
  // Avançar para votação
  socket.on('start_voting', (data) => {
    const room = rooms.get(data.roomCode);
    
    if (!room || room.state !== GAME_STATES.DAY) return;
    
    room.state = GAME_STATES.VOTING;
    room.votes = {};
    room.players.forEach(p => p.hasVoted = false);
    
    io.to(data.roomCode).emit('phase_change', { 
      phase: GAME_STATES.VOTING,
      day: room.currentDay
    });
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    console.log('Jogador desconectou:', socket.id);
    
    // Encontrar sala do jogador
    for (const [roomCode, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        // Se for o host e o jogo não começou, deletar sala
        if (room.host === socket.id && room.state === GAME_STATES.LOBBY) {
          rooms.delete(roomCode);
          io.to(roomCode).emit('room_closed', { message: 'O host saiu da sala' });
        } else if (room.state === GAME_STATES.LOBBY) {
          // Remover jogador do lobby
          room.players.splice(playerIndex, 1);
          io.to(roomCode).emit('room_updated', { room });
        } else {
          // Marcar como desconectado mas manter no jogo
          io.to(roomCode).emit('player_disconnected', { 
            playerName: room.players[playerIndex].name 
          });
        }
        
        break;
      }
    }
  });
});

// Funções auxiliares
function getRoleDescription(role) {
  const descriptions = {
    [ROLES.ASSASSINO]: 'Você é um ASSASSINO. Elimine todos os cidadãos sem ser descoberto.',
    [ROLES.DETETIVE]: 'Você é o DETETIVE. Investigue os suspeitos e descubra os assassinos.',
    [ROLES.ANJO]: 'Você é o ANJO. Proteja um jogador todas as noites.',
    [ROLES.CIDADAO]: 'Você é um CIDADÃO. Ajude a encontrar os assassinos através do debate.'
  };
  
  return descriptions[role] || '';
}

function resolveNight(room, roomCode) {
  const actions = room.nightActions;
  let killTarget = null;
  let protection = null;
  let investigation = null;
  
  // Obter ações
  if (actions[ROLES.ASSASSINO]) {
    killTarget = actions[ROLES.ASSASSINO].targetId;
  }
  
  if (actions[ROLES.ANJO]) {
    protection = actions[ROLES.ANJO].targetId;
  }
  
  if (actions[ROLES.DETETIVE]) {
    investigation = actions[ROLES.DETETIVE];
  }
  
  // Resolver investigação
  if (investigation) {
    const target = room.players.find(p => p.id === investigation.targetId);
    const result = target && target.role === ROLES.ASSASSINO ? 'assassino' : 'inocente';
    
    io.to(investigation.playerId).emit('investigation_result', {
      targetName: target ? target.name : 'Desconhecido',
      result: result
    });
  }
  
  // Resolver morte
  let deathMessage = 'Ninguém morreu esta noite.';
  
  if (killTarget && killTarget !== protection) {
    const victim = room.players.find(p => p.id === killTarget);
    if (victim) {
      victim.isAlive = false;
      deathMessage = `${victim.name} foi eliminado durante a noite.`;
      
      // Revelar papel para o jogador morto
      io.to(victim.id).emit('player_died', {
        message: 'Você foi eliminado!',
        role: victim.role
      });
    }
  } else if (killTarget === protection) {
    deathMessage = 'O anjo protegeu alguém esta noite! Ninguém morreu.';
  }
  
  // Verificar vitória
  const winCondition = checkWinCondition(room);
  if (winCondition) {
    room.state = GAME_STATES.GAME_OVER;
    io.to(roomCode).emit('game_over', {
      winner: winCondition.winner,
      message: winCondition.message,
      players: room.players
    });
    return;
  }
  
  // Avançar para o dia
  room.state = GAME_STATES.DAY;
  room.nightActions = {};
  room.players.forEach(p => p.hasActed = false);
  
  io.to(roomCode).emit('phase_change', { 
    phase: GAME_STATES.DAY,
    day: room.currentDay,
    nightResult: deathMessage
  });
}

function resolveVoting(room, roomCode) {
  const voteCounts = {};
  
  // Contar votos
  for (const [voterId, targetId] of Object.entries(room.votes)) {
    if (!voteCounts[targetId]) {
      voteCounts[targetId] = 0;
    }
    voteCounts[targetId]++;
  }
  
  // Encontrar mais votado
  let maxVotes = 0;
  let eliminated = null;
  
  for (const [playerId, votes] of Object.entries(voteCounts)) {
    if (votes > maxVotes) {
      maxVotes = votes;
      eliminated = playerId;
    }
  }
  
  let eliminationMessage = 'Não houve consenso. Ninguém foi eliminado.';
  
  if (eliminated && maxVotes > 0) {
    const victim = room.players.find(p => p.id === eliminated);
    if (victim) {
      victim.isAlive = false;
      eliminationMessage = `${victim.name} foi eliminado pela votação. Papel: ${victim.role.toUpperCase()}`;
      
      io.to(victim.id).emit('player_died', {
        message: 'Você foi eliminado pela votação!',
        role: victim.role
      });
    }
  }
  
  // Verificar vitória
  const winCondition = checkWinCondition(room);
  if (winCondition) {
    room.state = GAME_STATES.GAME_OVER;
    io.to(roomCode).emit('game_over', {
      winner: winCondition.winner,
      message: winCondition.message,
      players: room.players,
      votingResult: eliminationMessage
    });
    return;
  }
  
  // Nova noite
  room.currentDay++;
  room.state = GAME_STATES.NIGHT;
  room.votes = {};
  room.players.forEach(p => {
    p.hasVoted = false;
    p.hasActed = false;
  });
  
  io.to(roomCode).emit('voting_result', { 
    message: eliminationMessage,
    votes: voteCounts
  });
  
  setTimeout(() => {
    io.to(roomCode).emit('phase_change', { 
      phase: GAME_STATES.NIGHT,
      day: room.currentDay
    });
  }, 5000);
}

// Servir página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
