# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kizamu is a flashcard web application built on serverless architecture using Cloudflare Workers. It implements spaced repetition learning with the SM-2 algorithm.

**Tech Stack:**
- Frontend: React Router v7 on Cloudflare Workers
- Backend: Hone API on Cloudflare Workers  
- Database: Supabase (PostgreSQL)
- Storage: Cloudflare R2
- Authentication: Auth0
- Styling: Panda CSS with Park UI components
- Monorepo: PNPM workspaces with Turbo

## Architecture

```
packages/
├── apps/
│   ├── web-app/          # React Router v7 frontend
│   └── api-server/       # Hono API backend
└── libs/
    ├── db/               # Database layer (Drizzle ORM)
    └── schema/           # TypeScript schemas (Effect Schema)
```

## Essential Commands

### Development
```bash
# Start development servers
pnpm web-app dev          # Frontend (localhost:5173)
pnpm api-server dev       # API server

# Build everything
pnpm build               # Build all packages via Turbo

# Code quality (ALWAYS run before committing)
pnpm lint:fix            # Fix linting issues across all packages
```

### Testing
```bash
# Run tests with workspace configuration
pnpm test                # All tests via Vitest workspaces
pnpm test:coverage       # Generate coverage reports
```

### Database
```bash
pnpm db migrate          # Run database migrations
pnpm db studio           # Open Drizzle Studio
```

### Deployment
```bash
pnpm web-app deploy:worker     # Deploy frontend to Cloudflare Workers
pnpm api-server deploy:worker  # Deploy API to Cloudflare Workers
```

## Code Standards

**Linting/Formatting:** Biome with strict rules
- 2-space indentation, single quotes, no semicolons
- Strict unused imports/variables enforcement
- Import organization enabled

**TypeScript:** Strict configuration with Effect-ts integration

**Testing:** Vitest with Cloudflare Workers pool and Effect testing utilities

## Key Patterns

1. **Effect-ts Usage:** Heavy use of Effect framework for functional programming, error handling, and async operations
2. **Schema Validation:** Centralized schemas using Effect Schema in `packages/libs/schema/`
3. **Database Layer:** Drizzle ORM with type-safe operations in `packages/libs/db/`
4. **Serverless-First:** Designed for Cloudflare Workers edge execution
5. **Monorepo Structure:** Shared libraries between frontend and backend

## Development Workflow

1. **Code Quality Pipeline:** Lefthook runs pre-commit hooks for linting/formatting
2. **Workspace Management:** PNPM workspaces with Turbo for build orchestration  
3. **Type Safety:** Strict TypeScript with cross-package type sharing
4. **Edge Computing:** Both frontend and backend run on Cloudflare Workers

## Important Notes

- Always run `pnpm lint:fix` before committing
- Use Effect-ts patterns for error handling and async operations
- Database changes require migrations via Drizzle
- Frontend uses Panda CSS - check styled-system for generated styles
- Authentication flows through Auth0 - check services/auth/ for implementation