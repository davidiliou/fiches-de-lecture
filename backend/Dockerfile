FROM node:20-alpine

WORKDIR /app

COPY package.json /app/package.json
COPY tsconfig.json /app/tsconfig.json

RUN npm install

COPY src /app/src

EXPOSE 3000

CMD ["npm", "run", "dev"]

