# Imagem oficial e ultraleve do Node.js 18 Alpine
FROM node:18-alpine

# Define diretório de trabalho do contêiner
WORKDIR /app

# Copia manifestos de dependência
COPY package*.json ./

# Instala apenas dependências de produção para acelerar o build
RUN npm install --omit=dev

# Copia todos os arquivos da aplicação
COPY . .

# Porta padrão requerida pelo Cloud Run
ENV PORT=8080
EXPOSE 8080

# Comando para iniciar o servidor Node.js
CMD ["npm", "start"]
