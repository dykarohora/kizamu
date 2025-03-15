import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { Deck } from '@kizamu/schema'
import { eq } from 'drizzle-orm'
import { Effect, pipe } from 'effect'
import postgres from 'postgres'
import { NotFoundUserError } from '../user/error'
import { usersTable } from '../user/user.sql'
import { decksTable } from './deck.sql'
import { DuplicateDeckError } from './error'

/**
 * デッキ作成時に必要な入力情報
 * Deck型から必要なプロパティを抽出し、createdByをstring型として追加
 */
type CreateDeckInput = Pick<Deck, 'id' | 'name' | 'description'> & { createdBy: string }

/**
 * デッキをデータベースに新規登録する関数
 *
 * @param input - 登録するデッキの情報
 * @returns 作成されたデッキの情報を含むEffect
 */
export const createDeck = (
  input: CreateDeckInput,
): Effect.Effect<Deck, DuplicateDeckError | NotFoundUserError | SqlError.SqlError, PgDrizzle> =>
  pipe(
    Effect.gen(function* () {
      // データベース接続を取得
      const db = yield* PgDrizzle

      // 作成日時と更新日時を追加した新しいデッキオブジェクトを作成
      const now = new Date()
      const newDeck = {
        ...input,
        createdAt: now,
        updatedAt: now,
      }

      // デッキをデータベースに挿入
      yield* db.insert(decksTable).values(newDeck)

      // 作成したデッキとユーザー情報を取得
      const [result] = yield* db
        .select({
          id: decksTable.id,
          name: decksTable.name,
          description: decksTable.description,
          createdAt: decksTable.createdAt,
          updatedAt: decksTable.updatedAt,
          createdBy: {
            id: usersTable.id,
            name: usersTable.name,
          },
        })
        .from(decksTable)
        .innerJoin(usersTable, eq(decksTable.createdBy, usersTable.id))
        .where(eq(decksTable.id, input.id))
        .limit(1)

      // 作成したデッキ情報を返却
      return result
    }),
    Effect.catchTags({
      SqlError: (error) => {
        if (error.cause instanceof postgres.PostgresError) {
          // 一意性制約違反（デッキIDの重複）
          if (error.cause.code === '23505') {
            return Effect.fail(new DuplicateDeckError({ deckId: input.id }))
          }
          // 外部キー制約違反（存在しないユーザーID）
          if (error.cause.code === '23503') {
            return Effect.fail(new NotFoundUserError({ userId: input.createdBy }))
          }
        }
        return Effect.fail(error)
      },
    }),
  )
