import { afterEach, beforeEach, expect, it } from '@effect/vitest'
import { reset, seed } from 'drizzle-seed'
import { Effect, Exit, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import { DuplicateUserError, NotFoundUserError } from './error'
import { fetchUserById } from './fetchUserById'
import { createUser } from './createUser'
import * as schema from './user.sql'

const targetUserId = uuidv7()

beforeEach(async () => {
  const count = 10
  await seed(getSetupClient(), schema).refine((f) => ({
    usersTable: {
      count,
      columns: {
        id: f.valuesFromArray({
          values: [targetUserId, ...Array.from({ length: count - 1 }, () => uuidv7())],
          isUnique: true,
        }),
      },
    },
  }))
})

afterEach(async () => {
  await reset(getSetupClient(), schema)
})

it.effect('ユーザーが存在する場合、指定されたIDを持つユーザー情報が取得できること', () =>
  pipe(
    Effect.gen(function* () {
      expect.assertions(1)
      // Arrange
      const expectedUserId = targetUserId
      // Act
      const result = yield* fetchUserById(expectedUserId)
      // Assert
      expect(result.id).toEqual(expectedUserId)
    }),
    Effect.provide(getTestDriver()),
  ),
)

it.effect('ユーザーが存在しない場合、NotFoundUserErrorが発生すること', () =>
  pipe(
    Effect.gen(function* () {
      expect.assertions(2)
      // Arrange
      const nonExistentUserId = uuidv7()
      return yield* pipe(
        // Act
        fetchUserById(nonExistentUserId),
        Effect.exit,
        // Assert
        Effect.map((exit) =>
          Exit.match(exit, {
            onFailure: (cause) => {
              if (cause._tag === 'Fail') {
                expect(cause.error).toBeInstanceOf(NotFoundUserError)
                if (cause.error instanceof NotFoundUserError) {
                  expect(cause.error.userId).toEqual(nonExistentUserId)
                }
              }
            },
            onSuccess: () => {
              throw new Error('should not be called')
            },
          }),
        ),
      )
    }),
    Effect.provide(getTestDriver()),
  ),
)

it.effect('新しいユーザーを正常に挿入できること', () =>
  pipe(
    Effect.gen(function* () {
      expect.assertions(8)
      // Arrange
      const newUserId = uuidv7()
      const newUser = {
        id: newUserId,
        name: 'テストユーザー',
        email: 'test@example.com',
      }
      // Act
      const result = yield* createUser(newUser)
      // Assert
      expect(result.id).toEqual(newUserId)
      expect(result.name).toEqual('テストユーザー')
      expect(result.email).toEqual('test@example.com')
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)

      // 実際にDBに挿入されたことを確認
      const fetchedUser = yield* fetchUserById(newUserId)
      expect(fetchedUser.id).toEqual(newUserId)
      expect(fetchedUser.name).toEqual('テストユーザー')
      expect(fetchedUser.email).toEqual('test@example.com')
    }),
    Effect.provide(getTestDriver()),
  ),
)

it.effect('既存のIDを持つユーザーを挿入しようとするとDuplicateUserErrorが発生すること', () =>
  pipe(
    Effect.gen(function* () {
      expect.assertions(2)
      // Arrange
      const existingUserId = targetUserId // 既に存在するID
      const duplicateUser = {
        id: existingUserId,
        name: '重複ユーザー',
        email: 'duplicate@example.com',
      }

      return yield* pipe(
        // Act
        createUser(duplicateUser),
        Effect.exit,
        // Assert
        Effect.map((exit) =>
          Exit.match(exit, {
            onFailure: (cause) => {
              if (cause._tag === 'Fail') {
                expect(cause.error).toBeInstanceOf(DuplicateUserError)
                if (cause.error instanceof DuplicateUserError) {
                  expect(cause.error.userId).toEqual(existingUserId)
                }
              }
            },
            onSuccess: () => {
              throw new Error('should not be called')
            },
          }),
        ),
      )
    }),
    Effect.provide(getTestDriver()),
  ),
)
