# 🔧 MUDANÇAS OBRIGATÓRIAS NO BACKEND (server.js)

## 📋 Resumo das Mudanças no Servidor

Estas alterações precisam ser implementadas no seu arquivo `server.js` para que o jogo funcione corretamente com as novas mecânicas.

---

## 1. 🔄 ANÚNCIO DE NOVA RODADA (Rodada 2+)

### 📍 Quando implementar:
Após a votação terminar e antes da noite começar (apenas da rodada 2 em diante)

### 🔨 O que fazer:

Adicione um delay de 10 segundos mostrando "Começando Rodada X" antes da noite começar:

```javascript
// Depois que a votação termina:

function startNewRound(room) {
  room.round++;
  
  if (room.round >= 2) {
    // Envia mensagem de nova rodada
    io.to(room.id).emit('phaseChange', {
      phase: 'night',
      round: room.round,
      message: `🌙 Rodada ${room.round} começando...`
    });
    
    // O frontend já tem um overlay de 2 segundos
    // Depois automaticamente começa a noite
  } else {
    // Primeira rodada, vai direto pra noite
    io.to(room.id).emit('phaseChange', {
      phase: 'night',
      round: room.round,
      message: '🌙 A noite cai sobre a cidade...'
    });
  }
}
```

---

## 2. ✅ REVELAR QUEM O ASSASSINO TENTOU MATAR E QUEM O ANJO SALVOU

### 📍 Localização:
Na função que processa o fim da noite e início do dia (quando resolve as ações noturnas)

### 🔨 O que fazer:

**IMPORTANTE**: Agora você precisa revelar QUEM o assassino tentou matar E quem o anjo salvou:

```javascript
function processNight(gameRoom) {
  let killedPlayer = null;
  let savedPlayer = null;
  let wasSaved = false;
  
  // Pega as ações da noite
  const killAction = nightActions.find(a => a.action === 'kill');
  const saveAction = nightActions.find(a => a.action === 'save');
  
  if (killAction) {
    killedPlayer = killAction.target;
  }
  
  if (saveAction) {
    savedPlayer = saveAction.target;
  }
  
  // Verifica se o anjo salvou a pessoa certa
  if (killedPlayer && savedPlayer && killedPlayer === savedPlayer) {
    wasSaved = true;
    killedPlayer = null; // Ninguém morre
  }
  
  // Monta a mensagem do dia
  let dayMessage = '☀️ Amanheceu!\n';
  
  // CASO 1: Anjo salvou a pessoa que ia morrer
  if (wasSaved) {
    dayMessage += `🔪 O assassino tentou matar ${savedPlayer}...\n`;
    dayMessage += `😇 Mas o anjo o salvou! ✨`;
  } 
  // CASO 2: Alguém morreu (anjo salvou pessoa errada ou não salvou ninguém)
  else if (killedPlayer) {
    // Mata o jogador
    const player = players.find(p => p.nick === killedPlayer);
    if (player) {
      player.alive = false;
    }
    dayMessage += `💀 ${killedPlayer} foi morto esta noite!`;
    
    if (savedPlayer && savedPlayer !== killedPlayer) {
      dayMessage += `\n😇 O anjo tentou salvar ${savedPlayer}, mas não era quem estava em perigo.`;
    }
  }
  // CASO 3: Ninguém morreu e anjo não fez nada ou salvou alguém desnecessariamente
  else {
    if (savedPlayer) {
      dayMessage += `😇 O anjo tentou salvar ${savedPlayer}, mas não havia perigo esta noite.`;
    } else {
      dayMessage += 'A noite foi tranquila. Ninguém morreu.';
    }
  }
  
  // Envia a mensagem para todos
  io.to(roomId).emit('phaseChange', {
    phase: 'day',
    round: currentRound,
    message: dayMessage
  });
}
```

---

## 3. ✅ MOSTRAR SE O DETETIVE ACERTOU OU ERROU

### 📍 Localização:
Quando o detetive faz a investigação (action: 'investigate')

### 🔨 O que fazer:

Já está implementado no frontend! Mas certifique-se que o backend está enviando corretamente:

```javascript
// Quando processa a ação de investigar:

socket.on('nightAction', (data) => {
  if (data.action === 'investigate') {
    const targetPlayer = players.find(p => p.nick === data.target);
    
    if (targetPlayer) {
      const isAssassin = targetPlayer.role === 'assassino';
      
      // Envia SOMENTE para o detetive
      socket.emit('investigationResult', {
        message: `Você investigou ${data.target}`,
        isAssassin: isAssassin
      });
      
      // Confirma a ação
      socket.emit('actionConfirmed', {
        action: data.action,
        target: data.target
      });
    }
  }
});
```

O frontend já vai mostrar "ACERTOU!" ou "ERROU!" automaticamente.

---

## 4. ♾️ VOTAÇÃO INFINITA - SÓ ACABA QUANDO TODOS VOTAREM

### 📍 Localização:
Na lógica de votação

### 🔨 O que fazer:

**IMPORTANTE**: A votação NÃO deve ter timer! Ela só termina quando TODOS os jogadores vivos votarem.

```javascript
let votes = {}; // { playerNick: targetNick }

socket.on('vote', (data) => {
  const player = players.find(p => p.nick === socket.nick);
  
  // Verifica se jogador está vivo e ainda não votou
  if (player && player.alive && !player.voted) {
    // Registra voto
    votes[socket.nick] = data.target;
    player.voted = true;
    
    // Confirma voto para o jogador
    socket.emit('voteConfirmed', { target: data.target });
    
    // Atualiza estado do jogo para todos
    io.to(roomId).emit('gameState', getGameState(room));
    
    // Verifica se TODOS os jogadores vivos já votaram
    const alivePlayers = players.filter(p => p.alive);
    const allVoted = alivePlayers.every(p => p.voted);
    
    if (allVoted) {
      // Todos votaram! Processa resultado
      processVoting(room, votes);
    }
    // Se ainda faltam votos, não faz nada! Espera os outros votarem
  }
});

function processVoting(room, votes) {
  // Conta votos
  const voteCounts = {};
  
  Object.values(votes).forEach(target => {
    voteCounts[target] = (voteCounts[target] || 0) + 1;
  });
  
  // Encontra quem teve mais votos
  let maxVotes = 0;
  let eliminated = null;
  
  Object.entries(voteCounts).forEach(([player, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = player;
    }
  });
  
  // Elimina o jogador
  if (eliminated) {
    const player = room.players.find(p => p.nick === eliminated);
    if (player) {
      player.alive = false;
    }
    
    io.to(room.id).emit('votingResult', {
      message: `⚖️ ${eliminated} foi eliminado com ${maxVotes} votos!`
    });
  }
  
  // Reseta votos
  room.players.forEach(p => p.voted = false);
  
  // Verifica fim de jogo
  checkGameEnd(room);
  
  // Se jogo não acabou, começa nova rodada
  if (!room.gameEnded) {
    setTimeout(() => {
      startNewRound(room);
    }, 3000);
  }
}
```

---

## 5. ✅ ANJO VÊ TODOS OS JOGADORES (INCLUINDO QUEM PODE TER MORRIDO)

### 📍 Localização:
Isso JÁ está implementado no frontend!

### ℹ️ Como funciona agora:

- O anjo vê **TODOS** os jogadores vivos no início da noite
- Ele **NÃO** sabe quem o assassino está tentando matar
- Ele pode salvar qualquer pessoa, incluindo quem vai morrer
- Isso cria estratégia: o anjo tem que ADIVINHAR quem será atacado

**Não precisa mudar nada no backend para isso!**

---

## 6. ⚫ TELA PRETA ATÉ O DIA COMEÇAR

### ℹ️ Já implementado no frontend!

Agora funciona assim:
- **Cidadãos**: Tela preta a noite inteira
- **Assassino, Anjo, Detetive**: Fazem sua ação, depois tela fica preta
- **TODOS**: Só sai da tela preta quando o dia começar oficialmente

**Não precisa mudar nada no backend para isso!**

---

## 📊 VERIFICAÇÃO RÁPIDA - Checklist do Backend

Certifique-se que seu backend tem:

- [ ] ✅ Anúncio "Começando Rodada X" com delay de 2 segundos (rodadas 2+)
- [ ] ✅ Mensagem detalhada revelando quem assassino tentou matar
- [ ] ✅ Mensagem revelando quem o anjo salvou
- [ ] ✅ Diferentes mensagens para cada cenário (salvou certo, salvou errado, etc)
- [ ] ✅ Enviar `isAssassin: true/false` para o detetive
- [ ] ✅ Votação infinita - só termina quando TODOS votarem (sem timer!)
- [ ] ✅ Distribuição correta de papéis:
  - 3-4 jogadores: 1 assassino + cidadãos
  - 5-6 jogadores: 1 assassino, 1 detetive, 1 anjo + cidadãos
  - 7+ jogadores: 2 assassinos, 1 detetive, 2 anjos + cidadãos

---

## 🎯 FLUXO COMPLETO DE UMA RODADA

```
1. ⚖️ VOTAÇÃO (infinita - espera todos votarem)
   ↓
2. 💀 ELIMINAÇÃO (mostra quem foi eliminado)
   ↓
3. ⏱️ DELAY 3 segundos
   ↓
4. 🔄 "Começando Rodada X" (2 segundos) [APENAS RODADA 2+]
   ↓
5. 🌙 NOITE (assassino, anjo, detetive agem)
   ↓
6. ☀️ DIA (revela mortes/salvamentos com detalhes)
   ↓
7. 💬 DISCUSSÃO (10 segundos automáticos)
   ↓
8. 🔁 Volta para VOTAÇÃO
```

---

## 🎯 EXEMPLO COMPLETO DE MENSAGENS DO DIA

```javascript
// EXEMPLO 1: Anjo salvou quem ia morrer
"☀️ Amanheceu!
🔪 O assassino tentou matar João...
😇 Mas o anjo o salvou! ✨"

// EXEMPLO 2: Alguém morreu e anjo salvou pessoa errada
"☀️ Amanheceu!
💀 Maria foi morta esta noite!
😇 O anjo tentou salvar João, mas não era quem estava em perigo."

// EXEMPLO 3: Alguém morreu e anjo não fez nada
"☀️ Amanheceu!
💀 Pedro foi morto esta noite!"

// EXEMPLO 4: Ninguém morreu (assassino não agiu ou erro)
"☀️ Amanheceu!
😇 O anjo tentou salvar Carlos, mas não havia perigo esta noite."

// EXEMPLO 5: Noite tranquila
"☀️ Amanheceu!
A noite foi tranquila. Ninguém morreu."
```

---

## ⚠️ IMPORTANTE

Essas mudanças são essenciais para o jogo funcionar corretamente! 

O frontend está pronto e esperando essas informações do servidor. Implemente essas mudanças no seu `server.js` para que tudo funcione perfeitamente! 🚀
