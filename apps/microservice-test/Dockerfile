FROM node:23-alpine AS node_upstream
WORKDIR /srv/app

# Dev image
FROM node_upstream as dev

EXPOSE 4001
ENV PORT=4001

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]