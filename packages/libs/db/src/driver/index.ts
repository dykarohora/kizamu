import type { SqlClient, SqlError } from '@effect/sql'
import * as PgDrizzle from '@effect/sql-drizzle/Pg'
import { PgClient } from '@effect/sql-pg'
import { type ConfigError, Layer } from 'effect'

export const makeDbDriver = (
  config: PgClient.PgClientConfig,
): Layer.Layer<
  SqlClient.SqlClient | PgClient.PgClient | PgDrizzle.PgDrizzle,
  ConfigError.ConfigError | SqlError.SqlError,
  never
> => {
  const SqlLive = PgClient.layer(config)
  return PgDrizzle.layer.pipe(Layer.provideMerge(SqlLive))
}
