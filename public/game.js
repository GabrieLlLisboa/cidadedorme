const socket = io();

let myNick = '';
let myRole = '';
let gameState = {
  players: [],
  phase: 'waiting',
  round: 0
};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.getElementById('gameScreen');
const nickInput = document.getElementById('nickInput');
const loginMessage = document.getElementById('loginMessage');
const yourNick = document.getElementById('yourNick');
const currentPhase = document.getElementById('currentPhase');
const currentRound = document.getElementById('currentRound');
const playerCount = document.getElementById('playerCount');
const aliveCount = document.getElementById('aliveCount');
const roleInfo = document.getElementById('roleInfo');
const yourRole = document.getElementById('yourRole');
const phaseMessage = document.getElementById('phaseMessage');
const playersList = document.getElementById('playersList');
const startButton = document.getElementById('startButton');
const actionsPanel = document.getElementById('actionsPanel');
const actionButtons = document.getElementById('actionButtons');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

// Utility functions
function showMessage(element, text, type = 'info') {
  element.className = `message ${type}`;
  element.textContent = text;
  element.classList.remove('hidden');
}

function hideMessage(element) {
  element.classList.add('hidden');
}

function addChatMessage(nick, message, isSystem = false) {
  const div = document.createElement('div');
  div.className = isSystem ? 'chat-message system' : 'chat-message';
  
  if (isSystem) {
    div.textContent = message;
  } else {
    div.innerHTML = `<span class="nick">${nick}:</span>${message}`;
  }
  
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Game functions
function joinGame() {
  const nick = nickInput.value.trim();
  
  if (!nick) {
    showMessage(loginMessage, 'Por favor, digite um nick', 'error');
    return;
  }
  
  socket.emit('joinGame', { nick });
}

function startGame() {
  socket.emit('startGame');
}

function sendMessage() {
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  socket.emit('chatMessage', { message });
  chatInput.value = '';
}

function performNightAction(action, target) {
  socket.emit('nightAction', { action, target });
}

function vote(target) {
  socket.emit('vote', { target });
}

function updatePlayersList() {
  playersList.innerHTML = '';
  
  gameState.players.forEach(player => {
    const div = document.createElement('div');
    div.className = 'player-card';
    
    if (!player.alive) {
      div.classList.add('dead');
    }
    if (player.voted) {
      div.classList.add('voted');
    }
    
    const status = !player.alive ? '💀' : player.voted ? '✅' : '✔️';
    div.innerHTML = `${status} ${player.nick}`;
    
    playersList.appendChild(div);
  });
  
  // Show start button only in waiting phase with 3+ players
  if (gameState.phase === 'waiting' && gameState.players.length >= 3) {
    startButton.classList.remove('hidden');
  } else {
    startButton.classList.add('hidden');
  }
}

function updateActionsPanel() {
  actionButtons.innerHTML = '';
  actionsPanel.classList.add('hidden');
  
  const alivePlayers = gameState.players.filter(p => p.alive && p.nick !== myNick);
  
  if (gameState.phase === 'night' && myRole === 'assassino') {
    actionsPanel.classList.remove('hidden');
    document.getElementById('actionsTitle').textContent = '🔪 Escolha quem matar:';
    
    alivePlayers.forEach(player => {
      const btn = document.createElement('button');
      btn.textContent = player.nick;
      btn.onclick = () => performNightAction('kill', player.nick);
      actionButtons.appendChild(btn);
    });
  } else if (gameState.phase === 'night' && myRole === 'anjo') {
    actionsPanel.classList.remove('hidden');
    document.getElementById('actionsTitle').textContent = '😇 Escolha quem salvar:';
    
    alivePlayers.forEach(player => {
      const btn = document.createElement('button');
      btn.textContent = player.nick;
      btn.onclick = () => performNightAction('save', player.nick);
      actionButtons.appendChild(btn);
    });
  } else if (gameState.phase === 'night' && myRole === 'detetive') {
    actionsPanel.classList.remove('hidden');
    document.getElementById('actionsTitle').textContent = '🔍 Escolha quem investigar:';
    
    alivePlayers.forEach(player => {
      const btn = document.createElement('button');
      btn.textContent = player.nick;
      btn.onclick = () => performNightAction('investigate', player.nick);
      actionButtons.appendChild(btn);
    });
  } else if (gameState.phase === 'voting') {
    const me = gameState.players.find(p => p.nick === myNick);
    if (me && me.alive && !me.voted) {
      actionsPanel.classList.remove('hidden');
      document.getElementById('actionsTitle').textContent = '⚖️ Vote em quem eliminar:';
      
      alivePlayers.forEach(player => {
        const btn = document.createElement('button');
        btn.textContent = player.nick;
        btn.onclick = () => vote(player.nick);
        actionButtons.appendChild(btn);
      });
    }
  }
}

function updatePhaseDisplay(phase) {
  const phaseNames = {
    'waiting': 'Aguardando jogadores',
    'night': 'Noite',
    'day': 'Dia',
    'voting': 'Votação',
    'ended': 'Fim de jogo'
  };
  
  currentPhase.textContent = phaseNames[phase] || phase;
}

function getRoleEmoji(role) {
  const emojis = {
    'assassino': '🔪',
    'anjo': '😇',
    'detetive': '🔍',
    'cidadao': '👤'
  };
  return emojis[role] || '👤';
}

function getRoleClass(role) {
  return `role-${role}`;
}

// Socket event listeners
socket.on('joinedGame', (data) => {
  myNick = data.nick;
  yourNick.textContent = myNick;
  
  loginScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  addChatMessage('Sistema', `Bem-vindo, ${myNick}!`, true);
});

socket.on('roleAssigned', (data) => {
  myRole = data.role;
  yourRole.textContent = `${getRoleEmoji(data.role)} ${data.role.toUpperCase()}`;
  roleInfo.className = `role-info ${getRoleClass(data.role)}`;
  roleInfo.classList.remove('hidden');
  
  addChatMessage('Sistema', `Você é: ${data.role.toUpperCase()}`, true);
});

socket.on('gameState', (data) => {
  gameState = data;
  
  playerCount.textContent = data.playerCount;
  aliveCount.textContent = data.aliveCount;
  currentRound.textContent = data.round;
  
  updatePhaseDisplay(data.phase);
  updatePlayersList();
  updateActionsPanel();
});

socket.on('phaseChange', (data) => {
  gameState.phase = data.phase;
  gameState.round = data.round;
  
  currentRound.textContent = data.round;
  updatePhaseDisplay(data.phase);
  
  showMessage(phaseMessage, data.message, 'info');
  addChatMessage('Sistema', data.message, true);
  
  updateActionsPanel();
});

socket.on('playerJoined', (data) => {
  addChatMessage('Sistema', `${data.nick} entrou no jogo (${data.count} jogadores)`, true);
});

socket.on('playerLeft', (data) => {
  addChatMessage('Sistema', `${data.nick} saiu do jogo (${data.count} jogadores)`, true);
});

socket.on('actionConfirmed', (data) => {
  const actions = {
    'kill': 'matar',
    'save': 'salvar',
    'investigate': 'investigar'
  };
  
  addChatMessage('Sistema', `Ação confirmada: ${actions[data.action]} ${data.target}`, true);
  actionsPanel.classList.add('hidden');
});

socket.on('investigationResult', (data) => {
  showMessage(phaseMessage, data.message, data.isAssassin ? 'error' : 'success');
  addChatMessage('Sistema', data.message, true);
});

socket.on('voteConfirmed', (data) => {
  addChatMessage('Sistema', `Você votou em ${data.target}`, true);
  updateActionsPanel();
});

socket.on('votingResult', (data) => {
  showMessage(phaseMessage, data.message, 'warning');
  addChatMessage('Sistema', data.message, true);
});

socket.on('gameEnd', (data) => {
  gameState.phase = 'ended';
  updatePhaseDisplay('ended');
  
  let rolesText = '\n\nPapéis dos jogadores:\n';
  Object.entries(data.roles).forEach(([nick, role]) => {
    rolesText += `${nick}: ${getRoleEmoji(role)} ${role}\n`;
  });
  
  showMessage(phaseMessage, data.message + rolesText, data.winner === 'citizens' ? 'success' : 'error');
  addChatMessage('Sistema', data.message + rolesText, true);
  
  actionsPanel.classList.add('hidden');
});

socket.on('chatMessage', (data) => {
  addChatMessage(data.nick, data.message);
});

socket.on('error', (data) => {
  if (loginScreen.style.display !== 'none') {
    showMessage(loginMessage, data.message, 'error');
  } else {
    addChatMessage('Sistema', `Erro: ${data.message}`, true);
  }
});

// Enter key handlers
nickInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinGame();
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
