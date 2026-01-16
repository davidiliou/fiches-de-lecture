FROM node:20-alpine

WORKDIR /app

COPY package.json /app/package.json
COPY vite.config.ts /app/vite.config.ts
COPY tsconfig.json /app/tsconfig.json
COPY tsconfig.app.json /app/tsconfig.app.json
COPY tsconfig.node.json /app/tsconfig.node.json
COPY eslint.config.js /app/eslint.config.js
COPY index.html /app/index.html
COPY postcss.config.js /app/postcss.config.js
COPY tailwind.config.js /app/tailwind.config.js

RUN npm install

COPY public /app/public
COPY src /app/src

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

