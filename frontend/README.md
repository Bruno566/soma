# 🎲 Soma ou Sabota — O Jogo dos Dados

![Licença MIT](https://img.shields.io/badge/licença-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-19-cyan.svg)
![TailwindCSS](https://img.shields.io/badge/tailwind-3.4-38bdf8.svg)
![Gemini AI](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-orange.svg)

**Soma ou Sabota** é um eletrizante jogo de apostas e estratégia para 1 a 4 jogadores, misturando a emoção dos dados tridimensionais, sabotagens impiedosas em tempo real, cupons com códigos secretos e um narrador sarcástico impulsionado por inteligência artificial (Google Gemini).

---

## 🕹️ Mecânicas do Jogo

- **Dados 3D Realistas**: Dois dados com rolagem física em múltiplos eixos e marcadores nítidos.
- **Modo Normal (Rodadas 1 a 4)**:
  - **Soma 12**: Dobro da aposta (`+100%`)
  - **Soma 11**: `+50%`
  - **Soma 10**: `+30%`
  - **Soma 9**: `+10%`
  - **Soma 8**: Neutro (`0%`)
  - **Soma 7 a 3**: Perdas graduais (`-10%` a `-75%`)
  - **Soma 2 (Olhos de Cobra)**: Perda total da aposta (`-100%`)
- **Modo Pressão 🔥 (Rodada 5 em diante)**: A banca aperta o cerco! Os lucros diminuem e as penalidades se tornam severas.
- **Janela de Sabotagem Relâmpago ⏱️**: Chance aleatória durante a rodada de 10 segundos para:
  - Roubar 20% do saldo de um adversário.
  - Forçar aposta **ALL-IN** obrigatória no próximo lance do rival.
  - Aplicar taxa confiscatória imediata de R$ 1.000.
  - Rogar a *Maldição dos Dados* (+50% de dano na próxima derrota).
- **Códigos Secretos Misteriosos 🎁**: Sorteados ao longo do jogo e resgatáveis no painel de senhas.
- **Narrador de Cassino com Gemini AI 🎙️**: Comentários provocativos e espirituosos gerados dinamicamente para cada jogada.

---

## 📁 Estrutura do Repositório

```plaintext
soma-ou-sabota/
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD automatizado para o GitHub Actions
├── components/
│   ├── Dice3D.tsx          # Componente dos dados 3D e renderização de faces
│   ├── HistoryDrawer.tsx   # Painel lateral com histórico completo de lances
│   └── Modals.tsx          # Modais de Setup, Sabotagem, Regras e Campeão
├── services/
│   ├── audioService.ts     # Efeitos sonoros via Web Audio API
│   └── geminiService.ts    # Integração com a IA do Google Gemini
├── App.tsx                 # Estado e loop principal da partida
├── Dockerfile              # Imagem Docker leve pronta para nuvem
├── index.html              # Ponto de entrada HTML e estilos
├── index.tsx               # Montagem do React na DOM
├── package.json            # Configuração de scripts e dependências
├── server.js               # Servidor Node.js Express para produção e Cloud Run
├── types.ts                # Definições de tipos TypeScript
└── README.md               # Documentação oficial
```

---

## 🚀 Como Rodar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/soma-ou-sabota.git
cd soma-ou-sabota
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Iniciar o servidor
```bash
npm start
```

Abra o seu navegador em [http://localhost:8080](http://localhost:8080).

---

## 🌐 Como Fazer o Deploy

### Opção 1: Google Cloud Run (Recomendado)
Com o Google Cloud CLI instalado e configurado:
```bash
gcloud run deploy soma-ou-sabota \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars API_KEY="SUA_CHAVE_GEMINI"
```

### Opção 2: Deploy com Docker
```bash
# Construir a imagem
docker build -t soma-ou-sabota .

# Executar na porta 8080
docker run -p 8080:8080 -e API_KEY="SUA_CHAVE_GEMINI" soma-ou-sabota
```

### Opção 3: Deploy em Render, Railway ou Fly.io
1. Conecte este repositório do GitHub na plataforma escolhida.
2. Defina o comando de inicialização como: `npm start`.
3. Adicione a variável de ambiente `API_KEY` (chave do Gemini).

---

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `PORT` | Porta HTTP na qual o servidor Node.js escuta | `8080` |
| `API_KEY` | Chave de API do Google Gemini para narração IA | *(opcional)* |

---

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Node.js & Express**
- **Google Gen AI SDK (@google/genai)**
- **Web Audio API**
- **Lucide React**

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se livre para jogar, modificar e hospedar onde quiser!
