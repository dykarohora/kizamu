import { Either, ParseResult, Schema } from 'effect'
import type { Simplify } from 'effect/Types'
import type { Context, Env, Input, MiddlewareHandler, ValidationTargets } from 'hono'
import { validator } from 'hono/validator'

export type Hook<
  T,
  E extends Env,
  P extends string,
  Target extends keyof ValidationTargets = keyof ValidationTargets,
> = (
  result: ({ success: true; data: T } | { success: false; error: ParseResult.ArrayFormatterIssue[]; data: T }) & {
    target: Target
  },
  c: Context<E, P>,
) => Response | undefined | Promise<Response | undefined>

type HasUndefined<T> = undefined extends T ? true : false

/**
 * スキーマからフィールド名の配列を取得する
 * @param schema - Effect Schemaのスキーマオブジェクト
 * @returns フィールド名の配列
 */
const getSchemaFileds = <T, E>(schema: Schema.Schema<T, E>): string[] =>
  // スキーマにfieldsプロパティが存在する場合はそのキーを配列として返し、存在しない場合は空配列を返す
  'fields' in schema ? Object.keys(schema.fields as Record<string, unknown>) : []

export const effectValidator = <
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  Type,
  Encoded,
  In = Simplify<Encoded>,
  Out = Simplify<Type>,
  I extends Input = {
    in: HasUndefined<In> extends true
      ? {
          [K in Target]?: In extends ValidationTargets[K] ? In : { [K2 in keyof In]?: ValidationTargets[K][K2] }
        }
      : {
          [K in Target]: In extends ValidationTargets[K] ? In : { [K2 in keyof In]: ValidationTargets[K][K2] }
        }
    out: { [K in Target]: Out }
  },
>(
  target: Target,
  schema: Schema.Schema<Type, Encoded>,
  hook?: Hook<Type, E, P, Target>,
): MiddlewareHandler<E, P, I> =>
  // @ts-expect-error not typed well
  validator(target, async (value, c) => {
    let validatorValue = value

    if (target === 'header') {
      const schemaKeys = getSchemaFileds(schema)
      const caseInsensitiveKeymap = Object.fromEntries(schemaKeys.map((key) => [key.toLowerCase(), key]))

      validatorValue = Object.fromEntries(
        Object.entries(value).map(([key, value]) => [caseInsensitiveKeymap[key] || key, value]),
      )
    }

    const result = Schema.decodeUnknownEither(schema)(validatorValue)

    return Either.match(result, {
      onLeft: async (e) => {
        const error = ParseResult.ArrayFormatter.formatErrorSync(e)

        if (!hook) {
          return c.json({ code: 'BAD_REQUEST', message: 'Invalid request' }, 400)
        }

        const hookResult = await hook({ success: false, error, data: validatorValue, target }, c)
        if (!hookResult) {
          return c.json({ code: 'BAD_REQUEST', message: 'Invalid request' }, 400)
        }

        if (hookResult instanceof Response) {
          return hookResult
        }

        return c.json({ code: 'BAD_REQUEST', message: 'Invalid request' }, 400)
      },
      onRight: async (data) => {
        if (!hook) {
          return data
        }

        const hookResult = await hook({ success: true, data, target }, c)
        if (!hookResult) {
          return data
        }

        if (hookResult instanceof Response) {
          return hookResult
        }

        return data
      },
    })
  })
