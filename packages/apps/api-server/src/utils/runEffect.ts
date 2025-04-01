import { type DbDriver, makeDbDriver } from '@kizamu/db'
import { Effect, LogLevel, Logger, Redacted, pipe } from 'effect'

/**
 * JSONRespondReturn型を返すAPIルートを実行する
 * 型情報を保持したまま、ロギングやDBアクセスを含むEffectを実行
 *
 * @template R - Responseのサブタイプ（JSONRespondReturnの単一型またはUnion型）
 * @param effect 実行するEffect
 * @returns Promiseに変換されたEffect実行結果
 */
export const runEffect = <R extends Response>(effect: Effect.Effect<R, never, DbDriver>) => {
  const driver = makeDbDriver({
    url: Redacted.make((process.env.HYPERDRIVE as unknown as Hyperdrive).connectionString),
  })

  const program = pipe(
    effect,
    Effect.provide(driver),
    Effect.provide(Logger.structured),
    Logger.withMinimumLogLevel(LogLevel.Debug),
  )
  return Effect.runPromise(program)
}
