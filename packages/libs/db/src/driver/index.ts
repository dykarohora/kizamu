import type { SqlClient, SqlError } from '@effect/sql'
import * as PgDrizzle from '@effect/sql-drizzle/Pg'
import { PgClient } from '@effect/sql-pg'
import { type ConfigError, Layer } from 'effect'

let SqlLive: ReturnType<typeof PgClient.layer>

export const makeDbDriver = (
  config: PgClient.PgClientConfig,
): Layer.Layer<
  SqlClient.SqlClient | PgClient.PgClient | PgDrizzle.PgDrizzle,
  ConfigError.ConfigError | SqlError.SqlError,
  never
> => {
  if (!SqlLive) {
    SqlLive = PgClient.layer(config)
  }

  return PgDrizzle.layer.pipe(Layer.provideMerge(SqlLive))
}

export type DbDriver = SqlClient.SqlClient | PgClient.PgClient | PgDrizzle.PgDrizzle
