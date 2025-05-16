# kizamu

'kizamu' is a flashcard web application that supports efficient learning through spaced repetition. The application allows users to create, manage, and study flashcards with a focus on optimizing the learning process using the SM-2 algorithm.

## Overview

Kizamu provides the following core features:

- **Deck Management**: Create, edit, and delete flashcard decks
- **Card Management**: Create cards with text and images on both sides
- **Study System**: Spaced repetition learning based on the SM-2 algorithm
- **Tag Management**: Organize cards with tags for better categorization
- **Learning Analytics**: Visualize learning progress and performance

## System Architecture

Kizamu is built on a modern serverless architecture:

- **Frontend**: React Router v7 framework running on Cloudflare Workers
- **Backend**: Hono API running on Cloudflare Workers
- **Database**: Supabase (PostgreSQL-compatible)
- **Storage**: Cloudflare R2 for image storage
- **Authentication**: Auth0

This architecture provides low latency through edge execution, scalability through serverless design, and simplified operations through Cloudflare's integrated services.

## Project Structure

```
kizamu/
├── packages/
│   ├── apps/
│   │   ├── web-app/       # React Router frontend application
│   │   └── api-server/    # Hono API backend
│   └── libs/
│       └── schema/        # TypeScript type definitions using Effect Schema
└── 00_docs/               # Project documentation
```

## Development

The project uses a monorepo structure managed with PNPM workspaces. Each package can be developed independently:

- **Web App**: React Router v7 application for the user interface
- **API Server**: Hono-based REST API for backend operations
- **Schema**: TypeScript type definitions and validations using Effect Schema library, shared across the project
- **Database**: Packages responsible for accessing the database
## License

MIT 