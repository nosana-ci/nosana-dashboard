# Utiliser une image officielle Node.js
FROM node:18

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de l'application
RUN npm ci

# Copier tout le code source de l'application
COPY . .

# Générer la build de production statique
RUN npm run generate

# Installer 'serve' pour servir la build statique
RUN npm install -g serve

# Exposer le port utilisé par l'application
EXPOSE 3000

# Démarrer le serveur 'serve' pour servir la build statique
CMD ["serve", "-s", ".output/public", "-l", "3000"]