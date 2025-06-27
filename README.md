# Hackathon Project

## Overview

This repository contains a small platform built during a hackathon. It is composed of three main applications:

- **Frontend** – a Next.js interface.
- **API Gateway** – a NestJS server exposing REST endpoints and relying on a PostgreSQL database.
- **Form Generator Service** – a NestJS microservice responsible for producing form schemas using an AI model.

A `docker-compose.yml` file is provided to orchestrate these services together with a PostgreSQL container and a Mailhog instance for email testing.

## Getting started

### Full stack via Docker Compose

To launch the entire stack in containers:

```bash
docker compose up --build
```

This command starts Postgres, Mailhog, the API Gateway, the Form Generator Service and the Frontend. The frontend is then available on `http://localhost:3000`.

### Hybrid mode

You can also run only the database and Mailhog in Docker while starting the remaining applications locally. In one terminal run:

```bash
docker compose up postgres mailhog
```

Then, in separate terminals, start each application:

```bash
cd apps/api-gateway && npm install && npm run start:dev
```

```bash
cd apps/frontend && npm install && npm run dev
```

## Features

### Form generation

The `form-generator-service` streams a JSON description of a form based on a text prompt. The API Gateway exposes this through the `/generative-form` endpoint.

### Form extraction

The API Gateway provides endpoints to extract form structures or values from images or PDF files via `/extractor` and `/extract-data`.

### Universal chat

The `/universal-chat` endpoint lets you interact with an AI assistant that can also send emails through Mailhog. Chat templates can be managed through `/chat-infinite`.

## Development notes

- The project uses TypeScript across all applications.
- Environment variables can be configured in each app via their `.env` files. Each directory also provides a `.env.example` that lists the required keys.
- Copy the example file to `.env` and fill in your values before running the services.
- The AI provider is selected with the `AI_PROVIDER` variable; `mistral` is recommended and used by default if unset.
- Prisma migrations for the API Gateway reside in `apps/api-gateway/prisma`.
  - Run `npx prisma migrate deploy` inside `apps/api-gateway` to apply them.
  - Create a new migration with `npx prisma migrate dev --name <name>`.

Mailhog’s web UI is available on `http://localhost:8025` when running through Docker.

