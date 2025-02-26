# Kizamu API Server

This is the API server for Kizamu, a flashcard application that supports spaced repetition learning. The server is built with Hono and runs on Cloudflare Workers.

## Directory Structure 

```
packages/apps/api-server/
├── src/                      # Source code root directory
│   ├── index.ts              # Application entry point, Hono initialization
│   ├── routes/               # API route handlers
│   ├── features/             # Feature-specific business logic
│   ├── repositories/         # Data access layer
│   ├── middleware/           # Middleware
│   ├── utils/                # Utility functions
│   └── types/                # Type definitions
├── test/                     # Test code
├── wrangler.toml             # Cloudflare Workers configuration
└── package.json              # Package configuration
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Deployment

```bash
# Deploy to Cloudflare Workers
pnpm deploy
```

## Technologies

- TypeScript
- Hono (Web Framework)
- Cloudflare Workers
- Effect (for type-safe error handling)
- Drizzle ORM (for database access)