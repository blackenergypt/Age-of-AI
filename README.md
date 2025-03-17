# Age of AI

## Descrição
Age of AI é um jogo de estratégia em tempo real inspirado em Age of Empires, construído usando Node.js e tecnologia WebSocket. O jogo permite que os jogadores construam reinos, participem de batalhas e formem alianças em um mundo dinâmico.

## Funcionalidades
- Sistema de registro e login de usuários
- Confirmação por email para novos usuários
- Login via redes sociais (Discord, Twitter, Google e Facebook)
- Gameplay multiplayer em tempo real usando WebSocket
- Mundo de jogo dinâmico com gerenciamento de recursos
- Sistema de comércio entre jogadores
- Ciclo de dia e noite que afeta a jogabilidade
- Diferentes biomas e terrenos

## Tecnologias Utilizadas

### Backend
- **Node.js**: Plataforma de execução JavaScript
- **Express**: Framework web para Node.js
- **WebSocket (ws)**: Para comunicação em tempo real
- **Passport.js**: Para autenticação social
- **JWT**: Para autenticação baseada em tokens
- **Bcrypt**: Para criptografia de senhas
- **Nodemailer**: Para envio de emails de confirmação

### Frontend
- **HTML5/CSS3**: Para estrutura e estilo da interface
- **JavaScript**: Para interatividade do cliente
- **Canvas API**: Para renderização do jogo

### Monitoramento e Depuração
- **Sentry**: Para monitoramento de erros e desempenho

## Instalação

### Pré-requisitos
- Node.js (v14 ou superior)
- NPM ou PNPM

### Clonar o Repositório
git clone https://github.com/seu-usuario/age-of-ai.git
cd age-of-ai 