FROM node:23-alpine AS node_upstream
WORKDIR /srv/app

# Dev image
FROM node_upstream as dev

EXPOSE 4000
ENV PORT=4000

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]