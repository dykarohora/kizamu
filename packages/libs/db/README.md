# @kizamu/db

This package provides database access functionality for the Kizamu project using [Drizzle ORM](https://orm.drizzle.team/) with [@effect/sql](https://www.npmjs.com/package/@effect/sql) integration.

## Overview

`@kizamu/db` is a library designed to handle all database operations for the flashcard learning application "kizamu" in a type-safe manner. By leveraging Drizzle ORM with Effect's SQL integration, it achieves both type safety and functional error handling while maintaining clean separation of concerns.

## Features

- **Type Safety**: Complete type safety through Drizzle ORM and TypeScript
- **Effect Integration**: Seamless integration with Effect's functional error handling
- **Transaction Support**: Built-in support for database transactions
- **Schema Management**: Database schema definitions using Drizzle ORM
- **Repository Pattern**: Clean implementation of the repository pattern for data access

## Development

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- PostgreSQL 15 or higher

### Setup

```bash
# From the repository root directory
pnpm install

# Run database migrations
pnpm db:migrate
```

### Database Operations

```bash
# Generate migration files
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Reset database (for development)
pnpm db:reset
```

### Testing

```bash
pnpm test
```

## Usage Examples

### Basic Query

```typescript
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import { eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { usersTable } from './user.sql'

// Fetch user by ID
const fetchUserById = (userId: string) =>
  Effect.gen(function* () {
    const db = yield* PgDrizzle
    
    const result = yield* db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)

    if (result.length === 0) {
      return yield* Effect.fail(new NotFoundUserError({ userId }))
    }

    return result[0]
  })
```

### Transaction Example

```typescript
import { sql } from '@effect/sql'

const updateUser = (user) =>
  Effect.gen(function* () {
    const db = yield* PgDrizzle

    yield* sql.withTransaction(
      Effect.gen(function* () {
        const result = yield* db
          .update(usersTable)
          .set(user)
          .where(eq(usersTable.id, user.id))
          .returning({ id: usersTable.id })

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundUserError({ userId: user.id }))
        }
      })
    )

    return user
  })
```

## License

This project is licensed under the MIT.
