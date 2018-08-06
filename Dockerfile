FROM node:alpine

WORKDIR /app

RUN npm install

EXPOSE 3000

ADD . /app

CMD ["node", "src/index.js"]
