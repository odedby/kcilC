FROM node:alpine

WORKDIR /app

ADD . /app

RUN npm install

EXPOSE 3000

CMD ["node", "src/index.js"]
