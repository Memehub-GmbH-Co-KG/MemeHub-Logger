FROM node:14-alpine
WORKDIR /usr/src/memehub-logger
COPY . .
RUN npm install
CMD [ "npm", "run", "start" ]