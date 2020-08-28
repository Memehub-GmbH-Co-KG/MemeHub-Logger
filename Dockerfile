FROM node:14-alpine
WORKDIR /usr/src/memehub-logger
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "npm", "run", "start" ]