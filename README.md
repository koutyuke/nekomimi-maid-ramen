<div align="center">

  <h1>😽 Nekomimi Maid Ramen 🍜</h1>

  <p>A web application that connects ordering, checkout, cooking, and handoff for a school festival ramen shop.</p>

  <p>
    <a href="https://nekomimi-ramen.com"><strong>nekomimi-ramen.com</strong></a>
    &nbsp;&bull;&nbsp;
    <a href="https://api.nekomimi-ramen.com/openapi">OpenAPI</a>
    &nbsp;&bull;&nbsp;
    <a href="./docs/README.md">Docs</a>
    &nbsp;&bull;&nbsp;
    <a href="./LICENSE">License</a>
  </p>

  <p>
    <a href="https://github.com/koutyuke/nekomimi-maid-ramen/actions/workflows/ci.yml"><img src="https://github.com/koutyuke/nekomimi-maid-ramen/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-111111?style=flat" alt="MIT License"></a>
  </p>
</div>

## About

Nekomimi Maid Ramen connects a public menu with staff workflows for order entry, inventory, cooking, and handoff through a single source of order data. It prevents missed orders, checkout errors, orders for sold-out items, and handoff mistakes caused by verbal communication while keeping every staff member on the same page.

## Features

- 📱 Public menu with prices and availability
- 🧾 Order entry, total calculation, and inventory-aware confirmation
- 📦 Inventory monitoring and adjustment for each item
- 🍳 Shared cooking queue and status updates
- 🤝 Order number verification and handoff completion
- 🔐 Google sign-in and role-based staff access

## System Overview

```text
Visitor ----> Public Site --+
                            +--> API --> Cloudflare D1
Staff ------> Staff App ----+     |
                                  +--> Durable Objects / WebSocket
```

## Workspace & Stack

- `🌐 apps/site` - Public visitor site
  - **Astro** 🪐 _generates the static site._
  - **Tailwind CSS** 🎨 _styles the public interface._
  - **Storybook** 📕 _checks UI components and accessibility._
- `🧑‍🍳 apps/staff` - Staff operations interface
  - **React** ⚛️ _builds the staff user interface._
  - **Vite** ⚡ _provides the development server and production build._
  - **Mantine** 🎨 _provides UI components and styles._
  - **TanStack Router / Query** 🚦 _manages routing and server state._
  - **Jotai** 👻 _manages client state._
- `🔌 apps/api` - Authentication, ordering, and inventory API
  - **Elysia** 🦊 _builds the type-safe HTTP API._
  - **Effect** 💫 _manages business logic, errors, and dependencies._
  - **Drizzle ORM** 🗃️ _accesses Cloudflare D1._
  - **Better Auth** 🔐 _manages Google sign-in and sessions._
  - **Cloudflare Workers** ☁️ _runs the API, D1, and Durable Objects._
- `⚙️ packages/core` - Shared types and models for the interfaces and API
  - **TypeScript** 🔷 _defines HTTP configuration and business model types._

## Setup

### 1. Prepare the development environment

Install [Nix](https://nixos.org/download/) and [direnv](https://direnv.net/). The Nix development environment provides Node.js and pnpm.

```sh
git clone https://github.com/koutyuke/nekomimi-maid-ramen.git
cd nekomimi-maid-ramen
direnv allow
pnpm install
```

### 2. Prepare the local database

```sh
pnpm --filter @nekomimi/api db:migrate:local
pnpm --filter @nekomimi/api db:seed:local
```

### 3. Start the development servers

```sh
pnpm dev
```

Local URLs:

- Public site: <http://localhost:4321>
- Staff app: <http://localhost:5173>
- API: <http://localhost:8787>
- API reference: <http://localhost:8787/openapi>

To test Google sign-in, configure `apps/api/.dev.vars` by following the [Development and Operations Runbook](docs/runbook.md).

## Validation

```sh
pnpm check # lint, formatting, type checks, and tests
pnpm build # build all applications
```

See the [Development and Operations Runbook](docs/runbook.md) for commands covering individual applications, Storybook, databases, and deployment.

## Documentation

- 🧭 [Documentation index](docs/README.md) — how to navigate requirements, specifications, and decisions
- 🎯 [Project overview](docs/product/overview.md) — goals, users, and operational flow
- 🛠️ [Development and Operations Runbook](docs/runbook.md) — development, validation, deployment, authentication, and recovery
- 🧱 [Technology stack](docs/meta/decisions/DEC-SYS-003-technology-stack.md) — runtime and data store decisions

## License

Copyright 2026 koutyuke

This repository is licensed under the [MIT License](LICENSE).
