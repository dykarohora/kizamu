# @kizamu/schema

This package provides type definitions and schemas shared across the entire Kizamu project using [Effect Schema](https://effect.website/docs/schema).

## Overview

`@kizamu/schema` is a library designed to define domain models for the flashcard learning application "kizamu" in a type-safe manner. By leveraging Effect Schema, it achieves both runtime validation and compile-time type checking, ensuring consistent type usage throughout the application.

## Features

- **Type Safety**: Robust type checking with TypeScript and Effect Schema
- **Runtime Validation**: Ability to validate and transform data at runtime
- **Centralized Management**: Single source of truth for type definitions used across the project
- **Domain Models**: Defines domain models such as flashcards, decks, learning sessions, etc.

## Development

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

### Setup

```bash
# From the repository root directory
pnpm install
```

### Testing

```bash
pnpm test
```

## License

This project is licensed under the MIT. 