FROM node:23-alpine AS node_upstream
WORKDIR /srv/app

# Development image
FROM node_upstream as dev

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=localhost

COPY package.json .
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
