# 🌙 Cidade Dorme - Jogo Web Mobile-First

Aplicação web em tempo real do jogo social "Cidade Dorme", otimizada para dispositivos móveis.

## 🎮 Sobre o Jogo

Cidade Dorme é um jogo de dedução social onde jogadores assumem papéis secretos e tentam eliminar o time adversário através de estratégia, blefe e votação.

### Papéis

- **🔪 Assassino**: Elimina um jogador a cada noite sem ser descoberto
- **🔍 Detetive**: Investiga um jogador por noite para descobrir se é assassino
- **😇 Anjo**: Protege um jogador da morte a cada noite
- **👤 Cidadão**: Participa das discussões e votações para encontrar os assassinos

### Como Jogar

1. **Lobby**: O host cria uma sala e configura a quantidade de cada papel
2. **Distribuição**: Papéis são distribuídos aleatoriamente e mantidos em segredo
3. **Noite**: Papéis especiais (Assassino, Detetive, Anjo) realizam suas ações
4. **Dia**: Todos discutem no chat e tentam identificar suspeitos
5. **Votação**: Jogadores votam para eliminar um suspeito
6. **Vitória**: 
   - Cidade vence eliminando todos os assassinos
   - Assassinos vencem tomando controle da maioria

## 🚀 Tecnologias

- **Backend**: Node.js + Express.js
- **Tempo Real**: Socket.io
- **Frontend**: HTML5 + CSS3 + JavaScript Vanilla
- **Design**: Mobile-first, dark theme, responsivo

## 📦 Instalação Local

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd cidade-dorme

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start

# 4. Acesse no navegador
# http://localhost:3000
```

## 🌐 Deploy no Render

### Passo a Passo

1. **Crie uma conta no Render**
   - Acesse https://render.com
   - Faça cadastro gratuito

2. **Conecte seu Repositório**
   - Faça push do código para GitHub
   - No Render, clique em "New +" → "Web Service"
   - Conecte seu repositório

3. **Configure o Web Service**
   ```
   Name: cidade-dorme
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Deploy Automático**
   - Clique em "Create Web Service"
   - Aguarde o build e deploy
   - Acesse a URL fornecida pelo Render

### Variáveis de Ambiente (Opcional)

```
PORT=3000
NODE_ENV=production
```

## 📱 Uso

### Criar Sala

1. Digite seu nome
2. Clique em "Criar Sala"
3. Compartilhe o código da sala com amigos

### Entrar na Sala

1. Digite seu nome
2. Digite o código da sala
3. Clique em "Entrar"

### Configurar Jogo (Host)

1. Ajuste quantidade de cada papel
2. Aguarde jogadores entrarem (mínimo 4)
3. Clique em "Iniciar Jogo"

### Durante o Jogo

- **Noite**: Papéis especiais escolhem suas ações
- **Dia**: Todos podem usar o chat para discutir
- **Votação**: Escolha quem eliminar
- **Espectador**: Jogadores eliminados podem assistir

## 🎨 Características

- ✅ Design mobile-first responsivo
- ✅ Dark theme elegante
- ✅ Sincronização em tempo real
- ✅ Sem necessidade de narrador
- ✅ Suporta 4-12 jogadores
- ✅ Chat integrado
- ✅ Feedback visual e animações
- ✅ Sistema anti-trapaça básico
- ✅ Desconexão tratada
- ✅ Interface touch-optimized

## 🔧 Estrutura do Projeto

```
cidade-dorme/
├── server.js           # Servidor Express + Socket.io
├── package.json        # Dependências e scripts
├── public/
│   ├── index.html     # Estrutura HTML
│   ├── style.css      # Estilos e design
│   └── game.js        # Lógica do cliente
└── README.md          # Este arquivo
```

## 🎯 Recursos Implementados

### Backend
- ✅ Sistema de salas com códigos únicos
- ✅ Gerenciamento de estado do jogo em memória
- ✅ Distribuição aleatória de papéis
- ✅ Lógica de noite (assassino, detetive, anjo)
- ✅ Sistema de votação
- ✅ Verificação de condições de vitória
- ✅ Chat em tempo real
- ✅ Tratamento de desconexão

### Frontend
- ✅ 5 telas principais (Home, Lobby, Papel, Jogo, Fim)
- ✅ Interface mobile-first
- ✅ Design único com dark theme
- ✅ Animações suaves
- ✅ Feedback visual para ações
- ✅ Chat com scroll automático
- ✅ Modal de investigação
- ✅ Toast de notificações
- ✅ Indicadores de progresso

### Regras de Jogo
- ✅ Noite: ações simultâneas dos papéis especiais
- ✅ Proteção do anjo previne morte
- ✅ Investigação do detetive é privada
- ✅ Dia: chat livre entre jogadores vivos
- ✅ Votação: eliminação do mais votado
- ✅ Mortos: viram espectadores
- ✅ Vitória: cidade ou assassinos

## 🐛 Debugging

### Problemas Comuns

1. **Porta já em uso**
   ```bash
   # Altere a porta em server.js ou use variável de ambiente
   PORT=3001 npm start
   ```

2. **WebSocket não conecta**
   - Verifique se o firewall permite conexões
   - Confirme que a porta está aberta
   - No Render, use HTTPS (wss://)

3. **Jogadores não aparecem**
   - Verifique console do navegador (F12)
   - Confirme conexão com Socket.io
   - Teste com outro navegador

## 📈 Melhorias Futuras

- [ ] Banco de dados para histórico de partidas
- [ ] Sistema de autenticação
- [ ] Ranking de jogadores
- [ ] Novos papéis (Médico, Xerife, etc)
- [ ] Sons e efeitos sonoros
- [ ] Modo torneio
- [ ] Estatísticas detalhadas
- [ ] Replay de partidas
- [ ] Temas personalizáveis
- [ ] Idiomas múltiplos

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para:

1. Fork o projeto
2. Criar uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👥 Créditos

Desenvolvido como projeto técnico de demonstração de aplicação web real-time mobile-first.

## 📞 Suporte

Para problemas, dúvidas ou sugestões, abra uma issue no repositório.

---

**Divirta-se jogando Cidade Dorme! 🌙🔪**
