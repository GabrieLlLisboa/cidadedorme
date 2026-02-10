# 🔧 MUDANÇAS OBRIGATÓRIAS NO BACKEND (server.js)

## 📋 Resumo das Mudanças no Servidor

Estas alterações precisam ser implementadas no seu arquivo `server.js` para que o jogo funcione corretamente com as novas mecânicas.

---

## 1. ✅ REVELAR QUEM O ANJO SALVOU

### 📍 Localização:
Na função que processa o fim da noite e início do dia (quando resolve as ações noturnas)

### 🔨 O que fazer:

Quando processar as ações da noite, você precisa:
1. Verificar quem o assassino tentou matar
2. Verificar quem o anjo tentou salvar
3. Se forem a mesma pessoa, a pessoa sobrevive
4. **IMPORTANTE**: Avisar PARA TODOS quem foi salvo pelo anjo

```javascript
// Exemplo de implementação:

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
  let dayMessage = '';
  
  if (wasSaved) {
    // REVELAR QUEM FOI SALVO
    dayMessage = `☀️ Amanheceu! O anjo salvou ${savedPlayer} esta noite! ✨`;
  } else if (savedPlayer && !wasSaved) {
    // Anjo tentou salvar alguém mas não era quem ia morrer
    dayMessage = `☀️ Amanheceu! O anjo tentou salvar ${savedPlayer}, mas não era necessário.`;
  }
  
  if (killedPlayer) {
    // Mata o jogador
    const player = players.find(p => p.nick === killedPlayer);
    if (player) {
      player.alive = false;
    }
    dayMessage += `\n💀 ${killedPlayer} foi morto esta noite!`;
  }
  
  if (!killedPlayer && !wasSaved && !savedPlayer) {
    dayMessage = '☀️ Amanheceu! A noite foi tranquila.';
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

## 2. ✅ MOSTRAR SE O DETETIVE ACERTOU OU ERROU

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

## 3. ✅ ANJO VÊ TODOS OS JOGADORES (INCLUINDO QUEM PODE TER MORRIDO)

### 📍 Localização:
Isso JÁ está implementado no frontend!

### ℹ️ Como funciona agora:

- O anjo vê **TODOS** os jogadores vivos no início da noite
- Ele **NÃO** sabe quem o assassino está tentando matar
- Ele pode salvar qualquer pessoa, incluindo quem vai morrer
- Isso cria estratégia: o anjo tem que ADIVINHAR quem será atacado

**Não precisa mudar nada no backend para isso!**

---

## 4. ⚫ TELA PRETA ATÉ O DIA COMEÇAR

### ℹ️ Já implementado no frontend!

Agora funciona assim:
- **Cidadãos**: Tela preta a noite inteira
- **Assassino, Anjo, Detetive**: Fazem sua ação, depois tela fica preta
- **TODOS**: Só sai da tela preta quando o dia começar oficialmente

**Não precisa mudar nada no backend para isso!**

---

## 📊 VERIFICAÇÃO RÁPIDA - Checklist do Backend

Certifique-se que seu backend tem:

- [ ] ✅ Lógica de salvamento do anjo (comparar kill com save)
- [ ] ✅ Mensagem revelando QUEM foi salvo pelo anjo
- [ ] ✅ Mensagem dizendo se anjo salvou alguém desnecessariamente
- [ ] ✅ Enviar `isAssassin: true/false` para o detetive
- [ ] ✅ Distribuição correta de papéis:
  - 3-4 jogadores: 1 assassino + cidadãos
  - 5-6 jogadores: 1 assassino, 1 detetive, 1 anjo + cidadãos
  - 7+ jogadores: 2 assassinos, 1 detetive, 2 anjos + cidadãos

---

## 🎯 EXEMPLO COMPLETO DE LÓGICA DA NOITE

```javascript
function resolveNightActions(room) {
  const { players, nightActions } = room;
  
  // Coleta ações
  const killActions = nightActions.filter(a => a.action === 'kill');
  const saveAction = nightActions.find(a => a.action === 'save');
  
  // Processa mortes (pode ter 2 assassinos)
  let targets = killActions.map(k => k.target);
  let savedTarget = saveAction ? saveAction.target : null;
  
  // Remove salvos da lista de mortes
  if (savedTarget) {
    targets = targets.filter(t => t !== savedTarget);
  }
  
  // Mata os jogadores
  targets.forEach(target => {
    const player = players.find(p => p.nick === target);
    if (player) player.alive = false;
  });
  
  // Monta mensagem
  let message = '☀️ Amanheceu!\n';
  
  if (savedTarget) {
    const wasSaved = killActions.some(k => k.target === savedTarget);
    if (wasSaved) {
      message += `😇 O anjo salvou ${savedTarget}! ✨\n`;
    } else {
      message += `😇 O anjo tentou salvar ${savedTarget}, mas não era necessário.\n`;
    }
  }
  
  if (targets.length > 0) {
    message += `💀 ${targets.join(', ')} ${targets.length > 1 ? 'foram mortos' : 'foi morto'} esta noite!`;
  } else if (targets.length === 0 && !savedTarget) {
    message += 'A noite foi tranquila. Ninguém morreu.';
  }
  
  return message;
}
```

---

## ⚠️ IMPORTANTE

Essas mudanças são essenciais para o jogo funcionar corretamente! 

O frontend está pronto e esperando essas informações do servidor. Implemente essas mudanças no seu `server.js` para que tudo funcione perfeitamente! 🚀
