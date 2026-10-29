const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.disable('x-powered-by');

// Serve arquivos estáticos da raiz da aplicação
app.use(express.static(path.join(__dirname)));

// Endpoint de verificação de integridade (health check) para o Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Fallback para index.html em qualquer rota
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// O Cloud Run exige que o processo escute em 0.0.0.0 na porta fornecida por process.env.PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎲 Servidor do Soma ou Sabota escutando na porta ${PORT}!`);
});
