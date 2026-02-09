# 🌙 Cidade Dorme - Jogo Multiplayer

Jogo online multiplayer baseado no clássico "Cidade Dorme" (Mafia/Werewolf).

## 🎮 Como Funciona

### Papéis

**Distribuição automática por número de jogadores:**
- **3 jogadores**: 1 assassino + 2 cidadãos
- **5 jogadores**: 1 assassino + 1 anjo + 3 cidadãos  
- **6+ jogadores**: 1 assassino + 1 anjo + 1 detetive + resto cidadãos

**Papéis especiais:**
- 🔪 **Assassino**: Escolhe uma vítima toda noite
- 😇 **Anjo**: Salva um jogador toda noite
- 🔍 **Detetive**: Investiga se um jogador é o assassino
- 👤 **Cidadão**: Participa da votação para eliminar suspeitos

### Fluxo do Jogo

1. **Espera**: Mínimo 3 jogadores para começar
2. **Noite**: Assassino mata, anjo salva, detetive investiga
3. **Dia**: Revelação dos resultados da noite
4. **Votação**: A partir da 2ª rodada, todos votam para eliminar alguém
5. Repete até:
   - Assassino é eliminado → **Cidadãos vencem** 🎉
   - Apenas 1 cidadão sobra → **Assassino vence** 😈

## 🚀 Deploy no Render

### Passo 1: Criar conta no Render
1. Acesse [render.com](https://render.com)
2. Crie uma conta gratuita

### Passo 2: Fazer upload do código
Você tem 2 opções:

#### Opção A: Via GitHub (Recomendado)
1. Crie um repositório no GitHub
2. Faça upload de todos os arquivos:
   - `package.json`
   - `server.js`
   - `public/index.html`
   - `public/game.js`

3. No Render:
   - Clique em "New +"
   - Selecione "Web Service"
   - Conecte seu repositório GitHub
   - Configure:
     - **Name**: cidade-dorme (ou qualquer nome)
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

#### Opção B: Deploy direto
1. No Render, clique em "New +"
2. Selecione "Web Service"
3. Selecione "Public Git repository"
4. Cole a URL do repositório (se tiver) ou use deploy manual

### Passo 3: Configurar
- A porta já está configurada automaticamente (`process.env.PORT`)
- O banco SQLite será criado automaticamente
- Nenhuma variável de ambiente necessária

### Passo 4: Deploy
- Clique em "Create Web Service"
- Aguarde o deploy (leva 2-3 minutos)
- Sua URL será algo como: `https://cidade-dorme.onrender.com`

## 💻 Testar Localmente

```bash
# Instalar dependências
npm install

# Rodar servidor
npm start

# Acessar
http://localhost:3000
```

## 🎯 Como Jogar

1. Acesse a URL do jogo
2. Digite seu nick e clique em "Entrar no Jogo"
3. Aguarde outros jogadores (mínimo 3)
4. Qualquer jogador pode clicar em "Iniciar Jogo"
5. Você receberá seu papel secreto
6. Durante a noite:
   - **Assassino**: Escolha quem matar
   - **Anjo**: Escolha quem salvar
   - **Detetive**: Escolha quem investigar
7. Durante o dia: Use o chat para discutir
8. Durante a votação: Vote em quem eliminar

## 🛠️ Tecnologias

- **Backend**: Node.js + Express + Socket.IO
- **Database**: SQLite (better-sqlite3)
- **Frontend**: HTML + CSS + JavaScript vanilla
- **Deploy**: Render (free tier)

## 📝 Recursos

✅ Multiplayer em tempo real  
✅ Chat integrado  
✅ Distribuição automática de papéis  
✅ Interface responsiva  
✅ Sem necessidade de cadastro  
✅ Totalmente gratuito  

## ⚙️ Configurações Avançadas

### Alterar Regras
Edite o arquivo `server.js` na função `assignRoles()` para mudar a distribuição de papéis.

### Persistência de Dados
O SQLite salva histórico de partidas. Para reset completo, delete o arquivo `game.db`.

### WebSocket
O jogo usa Socket.IO para comunicação em tempo real. Certifique-se de que o Render suporta WebSockets (suporta no free tier).

## 🐛 Troubleshooting

**Problema**: Jogadores não conseguem se conectar  
**Solução**: Verifique se o deploy foi concluído e se a URL está correta

**Problema**: Jogo não inicia  
**Solução**: Precisa de mínimo 3 jogadores conectados

**Problema**: WebSocket não conecta  
**Solução**: Render suporta WebSocket, mas pode levar 1-2 min após deploy

## 📄 Licença

MIT - Livre para uso e modificação

---

Divirta-se jogando! 🎉
