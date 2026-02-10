// Conectar ao servidor
const socket = io();

// Estado do cliente
let currentRoom = null;
let myPlayerId = null;
let myRole = null;
let isAlive = true;

// Elementos DOM
const screens = {
  home: document.getElementById('home-screen'),
  lobby: document.getElementById('lobby-screen'),
  role: document.getElementById('role-screen'),
  game: document.getElementById('game-screen'),
  gameOver: document.getElementById('game-over-screen')
};

// Home Screen
const playerNameInput = document.getElementById('player-name-input');
const createRoomBtn = document.getElementById('create-room-btn');
const roomCodeInput = document.getElementById('room-code-input');
const joinRoomBtn = document.getElementById('join-room-btn');

// Lobby Screen
const roomCodeDisplay = document.getElementById('room-code-display');
const copyCodeBtn = document.getElementById('copy-code-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const playersList = document.getElementById('players-list');
const playerCount = document.getElementById('player-count');
const hostControls = document.getElementById('host-controls');
const waitingHost = document.getElementById('waiting-host');
const assassinoCountInput = document.getElementById('assassino-count');
const detetiveCountInput = document.getElementById('detetive-count');
const anjoCountInput = document.getElementById('anjo-count');
const cidadaoCount = document.getElementById('cidadao-count');
const startGameBtn = document.getElementById('start-game-btn');

// Role Screen
const roleCard = document.getElementById('role-card');
const roleIcon = document.getElementById('role-icon');
const roleName = document.getElementById('role-name');
const roleDescription = document.getElementById('role-description');
const roleUnderstoodBtn = document.getElementById('role-understood-btn');

// Game Screen
const phaseIndicator = document.getElementById('phase-indicator');
const phaseIcon = document.getElementById('phase-icon');
const phaseText = document.getElementById('phase-text');
const aliveCount = document.getElementById('alive-count');

const nightActionPanel = document.getElementById('night-action-panel');
const actionTitle = document.getElementById('action-title');
const actionSubtitle = document.getElementById('action-subtitle');
const targetList = document.getElementById('target-list');
const actionConfirmed = document.getElementById('action-confirmed');

const dayPanel = document.getElementById('day-panel');
const nightResult = document.getElementById('night-result');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const startVotingBtn = document.getElementById('start-voting-btn');

const votingPanel = document.getElementById('voting-panel');
const voteProgress = document.getElementById('vote-progress');
const votesCount = document.getElementById('votes-count');
const votesTotal = document.getElementById('votes-total');
const voteList = document.getElementById('vote-list');
const voteConfirmed = document.getElementById('vote-confirmed');

const spectatorPanel = document.getElementById('spectator-panel');
const deadRole = document.getElementById('dead-role');

// Game Over Screen
const winnerBadge = document.getElementById('winner-badge');
const winnerTitle = document.getElementById('winner-title');
const winnerMessage = document.getElementById('winner-message');
const finalPlayersList = document.getElementById('final-players-list');
const backToHomeBtn = document.getElementById('back-to-home-btn');

// Investigation Modal
const investigationModal = document.getElementById('investigation-modal');
const investigationResult = document.getElementById('investigation-result');
const closeInvestigationBtn = document.getElementById('close-investigation-btn');

// Toast
const toast = document.getElementById('toast');

// Utility Functions
function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[screenName].classList.add('active');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function getPlayerEmoji(index) {
  const emojis = ['🧑', '👩', '👨', '👧', '👦', '🧓', '👴', '👵', '🧔', '👱', '👲', '🧕'];
  return emojis[index % emojis.length];
}

function getRoleConfig(role) {
  const configs = {
    'assassino': {
      icon: '🔪',
      name: 'ASSASSINO',
      color: '#ef4444',
      description: 'Você é um ASSASSINO. Elimine todos os cidadãos sem ser descoberto.',
      action: 'Escolha quem eliminar'
    },
    'detetive': {
      icon: '🔍',
      name: 'DETETIVE',
      color: '#3b82f6',
      description: 'Você é o DETETIVE. Investigue os suspeitos e descubra os assassinos.',
      action: 'Escolha quem investigar'
    },
    'anjo': {
      icon: '😇',
      name: 'ANJO',
      color: '#10b981',
      description: 'Você é o ANJO. Proteja um jogador todas as noites.',
      action: 'Escolha quem proteger'
    },
    'cidadao': {
      icon: '👤',
      name: 'CIDADÃO',
      color: '#9ba3b4',
      description: 'Você é um CIDADÃO. Ajude a encontrar os assassinos através do debate.',
      action: null
    }
  };
  
  return configs[role] || configs['cidadao'];
}

// Home Screen Events
createRoomBtn.addEventListener('click', () => {
  const playerName = playerNameInput.value.trim();
  
  if (!playerName) {
    showToast('Digite seu nome');
    return;
  }
  
  socket.emit('create_room', { playerName });
});

joinRoomBtn.addEventListener('click', () => {
  const playerName = playerNameInput.value.trim();
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  
  if (!playerName) {
    showToast('Digite seu nome');
    return;
  }
  
  if (!roomCode) {
    showToast('Digite o código da sala');
    return;
  }
  
  socket.emit('join_room', { playerName, roomCode });
});

roomCodeInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase();
});

// Lobby Screen Events
copyCodeBtn.addEventListener('click', () => {
  const code = roomCodeDisplay.textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Código copiado!');
  });
});

leaveLobbyBtn.addEventListener('click', () => {
  currentRoom = null;
  showScreen('home');
});

function updateRoleCount() {
  const assassinos = parseInt(assassinoCountInput.value) || 0;
  const detetives = parseInt(detetiveCountInput.value) || 0;
  const anjos = parseInt(anjoCountInput.value) || 0;
  const totalPlayers = currentRoom ? currentRoom.players.length : 0;
  const cidadaos = Math.max(0, totalPlayers - assassinos - detetives - anjos);
  
  cidadaoCount.textContent = cidadaos;
}

assassinoCountInput.addEventListener('input', () => {
  updateRoleCount();
  if (currentRoom) {
    socket.emit('update_roles', {
      roomCode: currentRoom.code,
      roleConfig: {
        assassino: parseInt(assassinoCountInput.value) || 0,
        detetive: parseInt(detetiveCountInput.value) || 0,
        anjo: parseInt(anjoCountInput.value) || 0
      }
    });
  }
});

detetiveCountInput.addEventListener('input', () => {
  updateRoleCount();
  if (currentRoom) {
    socket.emit('update_roles', {
      roomCode: currentRoom.code,
      roleConfig: {
        assassino: parseInt(assassinoCountInput.value) || 0,
        detetive: parseInt(detetiveCountInput.value) || 0,
        anjo: parseInt(anjoCountInput.value) || 0
      }
    });
  }
});

anjoCountInput.addEventListener('input', () => {
  updateRoleCount();
  if (currentRoom) {
    socket.emit('update_roles', {
      roomCode: currentRoom.code,
      roleConfig: {
        assassino: parseInt(assassinoCountInput.value) || 0,
        detetive: parseInt(detetiveCountInput.value) || 0,
        anjo: parseInt(anjoCountInput.value) || 0
      }
    });
  }
});

startGameBtn.addEventListener('click', () => {
  if (currentRoom) {
    socket.emit('start_game', { roomCode: currentRoom.code });
  }
});

// Role Screen Events
roleUnderstoodBtn.addEventListener('click', () => {
  showScreen('game');
});

// Game Screen Events
sendMessageBtn.addEventListener('click', () => {
  sendChatMessage();
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendChatMessage();
  }
});

function sendChatMessage() {
  const message = chatInput.value.trim();
  
  if (!message || !currentRoom) return;
  
  socket.emit('send_message', {
    roomCode: currentRoom.code,
    message: message
  });
  
  chatInput.value = '';
}

startVotingBtn.addEventListener('click', () => {
  if (currentRoom) {
    socket.emit('start_voting', { roomCode: currentRoom.code });
  }
});

// Investigation Modal Events
closeInvestigationBtn.addEventListener('click', () => {
  investigationModal.classList.remove('active');
});

// Game Over Events
backToHomeBtn.addEventListener('click', () => {
  currentRoom = null;
  myRole = null;
  isAlive = true;
  showScreen('home');
});

// Socket Events
socket.on('room_created', (data) => {
  myPlayerId = socket.id;
  currentRoom = data.room;
  updateLobby(data.room);
  showScreen('lobby');
  showToast('Sala criada com sucesso!');
});

socket.on('room_updated', (data) => {
  currentRoom = data.room;
  updateLobby(data.room);
});

socket.on('game_started', (data) => {
  currentRoom = data.room;
});

socket.on('role_assigned', (data) => {
  myRole = data.role;
  const config = getRoleConfig(data.role);
  
  roleIcon.textContent = config.icon;
  roleName.textContent = config.name;
  roleDescription.textContent = data.roleDescription;
  roleCard.style.borderColor = config.color;
  
  showScreen('role');
});

socket.on('phase_change', (data) => {
  updatePhaseUI(data.phase, data.day);
  
  if (data.phase === 'night') {
    showNightPhase();
    if (data.nightResult) {
      nightResult.textContent = data.nightResult;
    }
  } else if (data.phase === 'day') {
    showDayPhase(data.nightResult);
  } else if (data.phase === 'voting') {
    showVotingPhase();
  }
});

socket.on('action_confirmed', () => {
  actionConfirmed.style.display = 'block';
  targetList.style.display = 'none';
});

socket.on('vote_confirmed', () => {
  voteConfirmed.style.display = 'block';
  voteList.style.display = 'none';
});

socket.on('vote_update', (data) => {
  votesCount.textContent = data.votesCount;
  votesTotal.textContent = data.totalVotes;
});

socket.on('investigation_result', (data) => {
  const resultText = data.result === 'assassino' 
    ? `${data.targetName} é ASSASSINO! 🔪`
    : `${data.targetName} NÃO é assassino.`;
  
  investigationResult.textContent = resultText;
  investigationModal.classList.add('active');
});

socket.on('voting_result', (data) => {
  showToast(data.message);
});

socket.on('player_died', (data) => {
  isAlive = false;
  deadRole.textContent = getRoleConfig(data.role).name;
  showToast(data.message);
});

socket.on('game_over', (data) => {
  showGameOver(data);
});

socket.on('new_message', (data) => {
  addChatMessage(data);
});

socket.on('player_disconnected', (data) => {
  showToast(`${data.playerName} desconectou`);
});

socket.on('room_closed', (data) => {
  showToast(data.message);
  showScreen('home');
});

socket.on('error', (data) => {
  showToast(data.message);
});

// UI Update Functions
function updateLobby(room) {
  roomCodeDisplay.textContent = room.code;
  playerCount.textContent = room.players.length;
  
  // Update players list
  playersList.innerHTML = '';
  room.players.forEach((player, index) => {
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    
    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.textContent = getPlayerEmoji(index);
    
    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = player.name;
    
    playerItem.appendChild(avatar);
    playerItem.appendChild(name);
    
    // Host badge
    if (player.id === room.host) {
      const badge = document.createElement('span');
      badge.className = 'player-badge';
      badge.textContent = 'Host';
      playerItem.appendChild(badge);
    }
    
    playersList.appendChild(playerItem);
  });
  
  // Show/hide host controls
  if (socket.id === room.host) {
    hostControls.style.display = 'block';
    waitingHost.style.display = 'none';
    
    assassinoCountInput.value = room.roleConfig.assassino;
    detetiveCountInput.value = room.roleConfig.detetive;
    anjoCountInput.value = room.roleConfig.anjo;
    updateRoleCount();
  } else {
    hostControls.style.display = 'none';
    waitingHost.style.display = 'block';
  }
}

function updatePhaseUI(phase, day) {
  if (phase === 'night') {
    phaseIcon.textContent = '🌙';
    phaseText.textContent = `Noite ${day}`;
  } else if (phase === 'day') {
    phaseIcon.textContent = '☀️';
    phaseText.textContent = `Dia ${day}`;
  } else if (phase === 'voting') {
    phaseIcon.textContent = '🗳️';
    phaseText.textContent = 'Votação';
  }
  
  // Update alive count
  if (currentRoom) {
    const alive = currentRoom.players.filter(p => p.isAlive).length;
    aliveCount.textContent = `${alive} vivos`;
  }
}

function showNightPhase() {
  // Hide all panels
  nightActionPanel.style.display = 'none';
  dayPanel.style.display = 'none';
  votingPanel.style.display = 'none';
  spectatorPanel.style.display = 'none';
  
  if (!isAlive) {
    spectatorPanel.style.display = 'block';
    return;
  }
  
  // Show action panel for special roles
  if (myRole === 'assassino' || myRole === 'detetive' || myRole === 'anjo') {
    const config = getRoleConfig(myRole);
    actionTitle.textContent = config.action;
    
    if (myRole === 'assassino') {
      actionSubtitle.textContent = 'Escolha um jogador para eliminar durante a noite.';
    } else if (myRole === 'detetive') {
      actionSubtitle.textContent = 'Descubra se um jogador é assassino ou inocente.';
    } else if (myRole === 'anjo') {
      actionSubtitle.textContent = 'Proteja um jogador de ser eliminado esta noite.';
    }
    
    renderTargetList();
    nightActionPanel.style.display = 'block';
    actionConfirmed.style.display = 'none';
    targetList.style.display = 'flex';
  }
}

function showDayPhase(nightResultMsg) {
  nightActionPanel.style.display = 'none';
  votingPanel.style.display = 'none';
  spectatorPanel.style.display = 'none';
  
  if (!isAlive) {
    spectatorPanel.style.display = 'block';
    return;
  }
  
  dayPanel.style.display = 'block';
  
  if (nightResultMsg) {
    nightResult.textContent = nightResultMsg;
    nightResult.style.display = 'block';
  } else {
    nightResult.style.display = 'none';
  }
  
  // Show voting button only for host
  if (socket.id === currentRoom.host) {
    startVotingBtn.style.display = 'block';
  } else {
    startVotingBtn.style.display = 'none';
  }
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showVotingPhase() {
  nightActionPanel.style.display = 'none';
  dayPanel.style.display = 'none';
  spectatorPanel.style.display = 'none';
  
  if (!isAlive) {
    spectatorPanel.style.display = 'block';
    return;
  }
  
  votingPanel.style.display = 'block';
  voteConfirmed.style.display = 'none';
  voteList.style.display = 'flex';
  
  const alivePlayers = currentRoom.players.filter(p => p.isAlive);
  votesTotal.textContent = alivePlayers.length;
  votesCount.textContent = '0';
  
  renderVoteList();
}

function renderTargetList() {
  targetList.innerHTML = '';
  
  if (!currentRoom) return;
  
  currentRoom.players.forEach((player, index) => {
    // Skip self and dead players
    if (player.id === socket.id || !player.isAlive) return;
    
    const button = document.createElement('button');
    button.className = 'target-button';
    
    const avatar = document.createElement('div');
    avatar.className = 'target-avatar';
    avatar.textContent = getPlayerEmoji(index);
    
    const info = document.createElement('div');
    info.className = 'target-info';
    
    const name = document.createElement('div');
    name.className = 'target-name';
    name.textContent = player.name;
    
    info.appendChild(name);
    button.appendChild(avatar);
    button.appendChild(info);
    
    button.addEventListener('click', () => {
      if (currentRoom) {
        socket.emit('night_action', {
          roomCode: currentRoom.code,
          targetId: player.id
        });
      }
    });
    
    targetList.appendChild(button);
  });
}

function renderVoteList() {
  voteList.innerHTML = '';
  
  if (!currentRoom) return;
  
  currentRoom.players.forEach((player, index) => {
    // Skip self and dead players
    if (player.id === socket.id || !player.isAlive) return;
    
    const button = document.createElement('button');
    button.className = 'target-button';
    
    const avatar = document.createElement('div');
    avatar.className = 'target-avatar';
    avatar.textContent = getPlayerEmoji(index);
    
    const info = document.createElement('div');
    info.className = 'target-info';
    
    const name = document.createElement('div');
    name.className = 'target-name';
    name.textContent = player.name;
    
    info.appendChild(name);
    button.appendChild(avatar);
    button.appendChild(info);
    
    button.addEventListener('click', () => {
      if (currentRoom) {
        socket.emit('vote', {
          roomCode: currentRoom.code,
          targetId: player.id
        });
      }
    });
    
    voteList.appendChild(button);
  });
}

function addChatMessage(data) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message';
  
  const author = document.createElement('div');
  author.className = `message-author ${data.isAlive ? '' : 'dead'}`;
  author.textContent = data.playerName;
  
  const text = document.createElement('div');
  text.className = 'message-text';
  text.textContent = data.message;
  
  const timestamp = document.createElement('div');
  timestamp.className = 'message-timestamp';
  const date = new Date(data.timestamp);
  timestamp.textContent = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  messageDiv.appendChild(author);
  messageDiv.appendChild(text);
  messageDiv.appendChild(timestamp);
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showGameOver(data) {
  if (data.winner === 'cidade') {
    winnerBadge.textContent = '🏆';
    winnerTitle.textContent = 'VITÓRIA DA CIDADE';
  } else {
    winnerBadge.textContent = '🔪';
    winnerTitle.textContent = 'VITÓRIA DOS ASSASSINOS';
  }
  
  winnerMessage.textContent = data.message;
  
  // Show all players and roles
  finalPlayersList.innerHTML = '';
  data.players.forEach((player, index) => {
    const item = document.createElement('div');
    item.className = 'final-player-item';
    
    const name = document.createElement('div');
    name.className = `final-player-name ${player.isAlive ? '' : 'dead'}`;
    name.textContent = `${getPlayerEmoji(index)} ${player.name}`;
    
    const role = document.createElement('div');
    role.className = 'final-player-role';
    role.textContent = getRoleConfig(player.role).name;
    
    item.appendChild(name);
    item.appendChild(role);
    
    finalPlayersList.appendChild(item);
  });
  
  showScreen('gameOver');
}

// Initialize
showScreen('home');
