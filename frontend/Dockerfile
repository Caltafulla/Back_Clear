FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
