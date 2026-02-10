# 🎨 Guia de Customização - Cidade Dorme

Este guia mostra como personalizar o jogo de acordo com suas preferências.

## 🎭 Adicionar Novos Papéis

### 1. Definir o Papel (server.js)

```javascript
// Adicione à constante ROLES (linha ~13)
const ROLES = {
  ASSASSINO: 'assassino',
  DETETIVE: 'detetive',
  ANJO: 'anjo',
  CIDADAO: 'cidadao',
  MEDICO: 'medico',  // NOVO PAPEL
};
```

### 2. Adicionar Lógica no Servidor (server.js)

```javascript
// Na função resolveNight, adicione a lógica do novo papel
if (actions[ROLES.MEDICO]) {
  const healTarget = actions[ROLES.MEDICO].targetId;
  // Lógica de cura aqui
}
```

### 3. Configuração no Frontend (game.js)

```javascript
// Na função getRoleConfig, adicione a configuração visual
function getRoleConfig(role) {
  const configs = {
    // ... papéis existentes
    'medico': {
      icon: '⚕️',
      name: 'MÉDICO',
      color: '#22c55e',
      description: 'Você é o MÉDICO. Pode reviver um jogador uma vez por jogo.',
      action: 'Escolha quem reviver'
    }
  };
  return configs[role] || configs['cidadao'];
}
```

### 4. Adicionar no Lobby (public/index.html)

```html
<!-- Adicione um controle de configuração -->
<div class="role-item">
  <label>⚕️ Médicos</label>
  <input type="number" id="medico-count" min="0" max="1" value="0">
</div>
```

---

## 🎨 Mudar Cores e Tema

### Alterar Paleta de Cores (public/style.css)

```css
:root {
  /* Mude estas variáveis para mudar o tema inteiro */
  --bg-primary: #0a0e17;        /* Fundo principal */
  --bg-secondary: #131825;      /* Fundo secundário */
  --bg-card: #1a2034;           /* Cards e elementos */
  
  --text-primary: #e8ecf4;      /* Texto principal */
  --text-secondary: #9ba3b4;    /* Texto secundário */
  
  --accent-primary: #5b8ef4;    /* Cor de destaque principal */
  --accent-secondary: #7c3aed;  /* Cor de destaque secundária */
  --accent-danger: #ef4444;     /* Vermelho (perigo) */
  --accent-success: #10b981;    /* Verde (sucesso) */
}
```

### Exemplos de Temas

#### Tema Claro
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --bg-card: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
}
```

#### Tema Cyberpunk
```css
:root {
  --bg-primary: #0f0f23;
  --bg-secondary: #1a1a2e;
  --bg-card: #16213e;
  --accent-primary: #00ff9f;
  --accent-secondary: #ff0099;
}
```

#### Tema Natureza
```css
:root {
  --bg-primary: #1a3a1a;
  --bg-secondary: #2d5a2d;
  --bg-card: #3d6a3d;
  --accent-primary: #7fba00;
  --accent-secondary: #a4de02;
}
```

---

## ⏱️ Ajustar Timers

### Timers Automáticos (server.js)

```javascript
// Adicione timers automáticos para cada fase
const NIGHT_DURATION = 45000;  // 45 segundos
const DAY_DURATION = 120000;   // 2 minutos
const VOTING_DURATION = 60000; // 1 minuto

// Implemente no código
setTimeout(() => {
  // Forçar fim da noite após X segundos
  resolveNight(room, roomCode);
}, NIGHT_DURATION);
```

### Timer Configurável por Sala

```javascript
// Na criação da sala (server.js)
const room = {
  // ... outros campos
  timers: {
    night: 45,    // segundos
    day: 120,     // segundos
    voting: 60    // segundos
  }
};
```

---

## 🔊 Adicionar Sons

### 1. Preparar Arquivos de Áudio

Coloque arquivos .mp3 ou .wav em `public/sounds/`:
```
public/
├── sounds/
│   ├── night.mp3
│   ├── day.mp3
│   ├── death.mp3
│   ├── vote.mp3
│   └── win.mp3
```

### 2. Criar Sistema de Sons (game.js)

```javascript
// Adicione no início do game.js
const sounds = {
  night: new Audio('/sounds/night.mp3'),
  day: new Audio('/sounds/day.mp3'),
  death: new Audio('/sounds/death.mp3'),
  vote: new Audio('/sounds/vote.mp3'),
  win: new Audio('/sounds/win.mp3')
};

// Função para tocar som
function playSound(soundName) {
  if (sounds[soundName]) {
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(err => {
      console.log('Erro ao tocar som:', err);
    });
  }
}

// Use nos eventos
socket.on('phase_change', (data) => {
  if (data.phase === 'night') {
    playSound('night');
  } else if (data.phase === 'day') {
    playSound('day');
  }
  // ... resto do código
});
```

---

## 📝 Personalizar Textos

### Mudar Nome do Jogo

```javascript
// Em public/index.html
<h1 class="game-title">Seu Nome Aqui</h1>

// Em public/manifest.json
{
  "name": "Seu Nome Aqui",
  "short_name": "Nome Curto"
}
```

### Mensagens Customizadas (server.js)

```javascript
// Personalize as mensagens do jogo
const MESSAGES = {
  nightStart: '🌙 A noite caiu sobre a cidade...',
  dayStart: '☀️ Um novo dia amanhece!',
  deathByKiller: '☠️ {name} foi encontrado morto!',
  protected: '😇 O anjo salvou alguém esta noite.',
  noDeaths: '✨ Todos sobreviveram à noite.',
  // ... mais mensagens
};
```

---

## 🎮 Modos de Jogo Alternativos

### Modo Rápido

```javascript
// Reduza quantidade de papéis especiais
const quickMode = {
  assassino: 1,
  detetive: 0,
  anjo: 0
};
```

### Modo Caos

```javascript
// Mais assassinos
const chaosMode = {
  assassino: 3,
  detetive: 2,
  anjo: 1
};
```

### Modo Clássico (sem poderes)

```javascript
// Apenas assassinos e cidadãos
const classicMode = {
  assassino: 2,
  detetive: 0,
  anjo: 0
};
```

---

## 📱 Personalizar PWA

### Ícone Customizado (public/manifest.json)

1. Crie ícones 192x192 e 512x512 pixels
2. Salve como `icon-192.png` e `icon-512.png` em `public/`
3. Atualize manifest.json:

```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🔐 Adicionar Sistema de Senhas

### Senha para Sala (server.js)

```javascript
// Ao criar sala
socket.on('create_room', (data) => {
  const room = {
    // ... campos existentes
    password: data.password || null  // Senha opcional
  };
});

// Ao entrar
socket.on('join_room', (data) => {
  const room = rooms.get(data.roomCode);
  
  if (room.password && room.password !== data.password) {
    socket.emit('error', { message: 'Senha incorreta' });
    return;
  }
  // ... continuar lógica
});
```

### UI para Senha (public/index.html)

```html
<input type="password" id="room-password" placeholder="Senha (opcional)">
```

---

## 📊 Adicionar Estatísticas

### Rastrear Estatísticas (server.js)

```javascript
const stats = {
  totalGames: 0,
  totalPlayers: 0,
  assassinWins: 0,
  cityWins: 0
};

// Atualize ao fim de cada jogo
function endGame(winner) {
  stats.totalGames++;
  if (winner === 'assassinos') {
    stats.assassinWins++;
  } else {
    stats.cityWins++;
  }
}
```

---

## 🌐 Múltiplos Idiomas

### Sistema de i18n Simples (game.js)

```javascript
const translations = {
  'pt-BR': {
    nightPhase: 'Noite',
    dayPhase: 'Dia',
    voting: 'Votação'
  },
  'en-US': {
    nightPhase: 'Night',
    dayPhase: 'Day',
    voting: 'Voting'
  }
};

let currentLang = 'pt-BR';

function t(key) {
  return translations[currentLang][key] || key;
}

// Uso
phaseText.textContent = t('nightPhase');
```

---

## 💾 Salvar Histórico de Partidas

### Com LocalStorage (game.js)

```javascript
function saveGameHistory(gameData) {
  const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
  history.push({
    date: new Date().toISOString(),
    winner: gameData.winner,
    players: gameData.players.length,
    duration: gameData.duration
  });
  localStorage.setItem('gameHistory', JSON.stringify(history));
}
```

---

## 🎯 Dicas Finais

- **Teste sempre** após cada mudança
- **Faça backup** antes de grandes alterações
- **Documente** suas customizações
- **Compartilhe** suas melhorias com a comunidade
- **Divirta-se** experimentando!

---

Para mais ideias, consulte:
- Documentação do Socket.io: https://socket.io/docs/
- Referência CSS: https://developer.mozilla.org/pt-BR/docs/Web/CSS
- Tutoriais de Node.js: https://nodejs.org/en/docs/

**Boa customização! 🎨🚀**
