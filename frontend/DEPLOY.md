# Guia de Deploy no Google Cloud Run / Cloud Build

Este guia resolve o erro:
`"The source code failed to build. This may indicate an error in the provided code."`

O Cloud Run e o Cloud Build Buildpacks exigem um ponto de entrada executável (como um servidor Node.js/Express ouvindo `process.env.PORT` e `0.0.0.0` ou um `Dockerfile`).

---

## 1. Estrutura dos Arquivos no Seu Projeto

Certifique-se de que a raiz da sua pasta contenha exatamente estes arquivos:

```
soma-ou-sabota/
├── package.json          <- Define dependências e "start": "node server.js"
├── server.js             <- Servidor Express que escuta process.env.PORT
├── Dockerfile            <- Instrução de contêiner para o Cloud Run
├── .dockerignore         <- Ignora arquivos desnecessários no build
├── index.html            <- Ponto de entrada do jogo
├── index.tsx             <- Componente montador React
├── App.tsx               <- Lógica principal do jogo
├── types.ts              <- Tipos TypeScript
├── metadata.json         <- Metadados da aplicação
├── components/           <- Modais, dados 3D e histórico
│   ├── Dice3D.tsx
│   ├── Modals.tsx
│   └── HistoryDrawer.tsx
└── services/             <- Áudio e IA Gemini
    ├── audioService.ts
    └── geminiService.ts
```

---

## 2. Testar Localmente antes do Deploy

1. Abra o terminal na pasta do projeto e instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```

3. Abra o navegador em `http://localhost:8080`. Se o jogo carregar normalmente, está pronto para o Cloud Run!

---

## 3. Deploy no Google Cloud Run (3 Formas Simples)

### Opção A: Pelo Terminal via Google Cloud CLI (Recomendado)

Abra o terminal dentro da pasta do projeto e execute:

```bash
gcloud run deploy soma-ou-sabota \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars API_KEY="SUA_CHAVE_GEMINI_AQUI"
```

> **Dica**: O parâmetro `--source .` instrui o Google Cloud Build a empacotar o projeto automaticamente usando o `Dockerfile` incluído.

---

### Opção B: Pelo Painel Web do Google Cloud Console

1. Acesse o **Google Cloud Console** > **Cloud Run**.
2. Clique em **Criar Serviço** (Create Service).
3. Selecione **"Implantar continuamente a partir de um repositório"** (conectando seu GitHub/GitLab) OU selecione **"Fazer upload da pasta de origem"**.
4. Em **Porta do contêiner**, defina `8080`.
5. Em **Variáveis de Ambiente**, adicione:
   - `PORT`: `8080`
   - `API_KEY`: sua chave de API do Google Gemini (necessária para os comentários do Narrador IA).
6. Marque **"Permitir invocações não autenticadas"** para que qualquer jogador possa acessar o jogo pelo link público.
7. Clique em **Criar** (Create). O deploy será concluído em menos de 2 minutos gerando a URL HTTPS pública.
