# 🚀 GUIA RÁPIDO DE INSTALAÇÃO

## ⚡ Opção 1: Executar Localmente (Desenvolvimento)

### Pré-requisitos
- Node.js 18+ instalado
- Terminal/CMD

### Passos

```bash
# 1. Entre na pasta do projeto
cd cidade-dorme

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start

# 4. Acesse no navegador
http://localhost:3000
```

**Pronto!** O jogo estará rodando localmente. Abra em múltiplas abas/dispositivos na mesma rede para testar.

---

## 🌐 Opção 2: Deploy no Render (Produção - GRÁTIS)

### Pré-requisitos
- Conta no GitHub (gratuita)
- Conta no Render (gratuita)

### Passos Detalhados

#### 1️⃣ Preparar o Código

```bash
# Inicialize um repositório Git (se ainda não fez)
git init

# Adicione todos os arquivos
git add .

# Faça o commit
git commit -m "Initial commit - Cidade Dorme"
```

#### 2️⃣ Subir para o GitHub

1. Crie um novo repositório no GitHub (https://github.com/new)
   - Nome: `cidade-dorme`
   - Público ou Privado (sua escolha)
   - NÃO adicione README, .gitignore ou licença (já temos)

2. Conecte seu repositório local ao GitHub:

```bash
git remote add origin https://github.com/SEU-USUARIO/cidade-dorme.git
git branch -M main
git push -u origin main
```

#### 3️⃣ Deploy no Render

1. **Acesse Render**
   - Vá para https://render.com
   - Faça login/cadastro (pode usar conta GitHub)

2. **Criar Web Service**
   - Clique no botão **"New +"**
   - Selecione **"Web Service"**

3. **Conectar Repositório**
   - Clique em **"Connect GitHub"** (ou GitLab/Bitbucket)
   - Autorize o Render a acessar seus repositórios
   - Selecione o repositório `cidade-dorme`

4. **Configurar o Service**
   
   Preencha os campos:
   
   ```
   Name: cidade-dorme
   Region: Oregon (US West) [ou o mais próximo de você]
   Branch: main
   Root Directory: [deixe em branco]
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

5. **Variáveis de Ambiente (Opcional)**
   
   Clique em "Advanced" e adicione:
   ```
   PORT = 3000
   NODE_ENV = production
   ```

6. **Deploy!**
   - Clique em **"Create Web Service"**
   - Aguarde 2-5 minutos enquanto o Render:
     - Clona seu repositório
     - Instala as dependências
     - Inicia o servidor
   
7. **Acesse seu Jogo**
   - Quando o deploy finalizar, você verá a URL no topo
   - Exemplo: `https://cidade-dorme-xyz.onrender.com`
   - **Compartilhe essa URL com seus amigos!**

### ⚙️ Configurações Adicionais no Render

#### Auto-Deploy (Recomendado)
- Ativado por padrão
- Cada push no GitHub dispara um novo deploy automaticamente

#### Health Checks
- Render faz health checks automáticos
- Path: `/`
- Se o servidor não responder, Render reinicia automaticamente

#### Logs
- Acesse "Logs" no painel do Render
- Veja em tempo real o que está acontecendo
- Útil para debugging

---

## 📱 Usando o Jogo

### Como Host

1. Acesse a URL do jogo
2. Digite seu nome
3. Clique em **"Criar Sala"**
4. Compartilhe o código de 6 letras com os jogadores
5. Configure os papéis
6. Quando todos entrarem, clique em **"Iniciar Jogo"**

### Como Jogador

1. Acesse a URL do jogo
2. Digite seu nome
3. Digite o código da sala
4. Clique em **"Entrar"**
5. Aguarde o host iniciar

---

## 🔧 Troubleshooting

### "Cannot GET /" ou página não carrega
- Verifique se o servidor iniciou corretamente
- Veja os logs no Render
- Confirme que `npm start` funciona localmente

### WebSocket não conecta
- No Render, sempre use HTTPS (wss://)
- Verifique se há firewall bloqueando
- Teste em navegador anônimo

### Servidor hiberna no Render (plano grátis)
- No plano Free do Render, apps hibernam após 15min de inatividade
- Primeiro acesso após hibernar leva ~1min para "acordar"
- Considere plano pago para manter sempre ativo

### Jogadores não sincronizam
- Todos devem usar a mesma URL
- Limpe cache do navegador (Ctrl+Shift+Del)
- Verifique console do navegador (F12)

---

## 🎮 Dicas de Uso

- **Mínimo 4 jogadores** para jogo balanceado
- **Ideal 6-8 jogadores** para melhor experiência
- Use **fones de ouvido** para não revelar seu papel
- **Não compartilhe tela** durante o jogo
- Configure **papéis equilibrados** (exemplo: 1 assassino para cada 3-4 jogadores)

---

## 💡 Próximos Passos

Depois do deploy funcionar:

1. **Personalize**
   - Mude cores no `style.css`
   - Ajuste regras no `server.js`
   - Adicione novos papéis

2. **Compartilhe**
   - Envie a URL para amigos
   - Teste com diferentes grupos
   - Colete feedback

3. **Melhore**
   - Adicione banco de dados
   - Implemente rankings
   - Crie novos modos de jogo

---

## 📞 Precisa de Ajuda?

- Abra uma issue no GitHub
- Verifique a documentação do Render: https://render.com/docs
- Consulte documentação do Socket.io: https://socket.io/docs/

**Boa sorte e bom jogo! 🌙🔪**
