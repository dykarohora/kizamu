import { Schema } from 'effect'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { effectValidator } from './validator'

describe('validator', () => {
  /**
   * バリデーション用の共通スキーマ定義
   * - requestBody: リクエストボディのスキーマ (name: string, age: number)
   * - query: クエリパラメータのスキーマ (school?: string)
   * - header: ヘッダーのスキーマ (X-Api-Key: string)
   */
  const schemas = {
    requestBody: Schema.Struct({
      name: Schema.String,
      age: Schema.Number,
    }),
    query: Schema.Union(
      Schema.Struct({
        school: Schema.optional(Schema.String),
      }),
      Schema.Undefined,
    ),
    header: Schema.Struct({
      'X-Api-Key': Schema.String,
    }),
  }

  /**
   * テスト用の有効なデータセット
   * - requestBody: 有効なリクエストボディデータ
   * - query: 有効なクエリパラメータ
   * - header: 有効なヘッダー
   */
  const validData = {
    requestBody: {
      name: 'Superman',
      age: 20,
    },
    query: {
      school: 'Metallo',
    },
    header: {
      'X-Api-Key': 'valid-api-key',
    },
  }

  /**
   * テスト用のJSONリクエストを作成するヘルパー関数
   * @param params - リクエストパラメータ
   * @param params.path - リクエストパス
   * @param params.body - リクエストボディ
   * @param params.query - クエリ文字列（オプション）
   * @param params.headers - リクエストヘッダー（オプション）
   * @returns Request - 設定されたリクエストオブジェクト
   */
  const createJsonRequest = ({
    path,
    body,
    query = '',
    headers = {},
  }: {
    path: string
    body: unknown
    query?: string
    headers?: Record<string, string>
  }) => {
    const url = `http://localhost${path}${query ? `?${query}` : ''}`
    return new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    })
  }

  describe('基本的なバリデーション', () => {
    const app = new Hono()

    // biome-ignore format:
    app.post(
      '/person',
      effectValidator('json', schemas.requestBody),
      effectValidator('query', schemas.query),
      (c) => {
        const data = c.req.valid('json')
        const query = c.req.valid('query')

        return c.json({
          success: true,
          data,
          query,
        })
      },
    )

    it('有効なデータが渡された場合に、バリデーションが成功しデータが返されること', async () => {
      expect.assertions(2)
      // Arrange: 有効なリクエストボディとクエリパラメータを準備
      const req = createJsonRequest({
        path: '/person',
        body: validData.requestBody,
        query: 'school=Metallo',
      })

      // Act: リクエストを実行
      const res = await app.request(req)

      // Assert: レスポンスの検証
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({
        success: true,
        data: validData.requestBody,
        query: {
          school: 'Metallo',
        },
      })
    })

    it('無効なJSONデータが渡された場合に、エラーレスポンスが返されること', async () => {
      expect.assertions(2)
      // Arrange: 無効なリクエストボディ（ageが文字列）を準備
      const invalidBody = { ...validData.requestBody, age: 'twenty' }
      const req = createJsonRequest({
        path: '/person',
        body: invalidBody,
        query: 'school=Metallo',
      })

      // Act: リクエストを実行
      const res = await app.request(req)

      // Assert: エラーレスポンスの検証
      expect(res.status).toBe(400)
      expect(await res.json()).toStrictEqual({
        success: false,
        error: [
          {
            _tag: 'Type',
            message: 'Expected number, actual "twenty"',
            path: ['age'],
          },
        ],
      })
    })

    it('無効なクエリパラメータが渡された場合に、そのパラメータは無視されること', async () => {
      expect.assertions(2)
      // Arrange: 無効なクエリパラメータを準備
      const req = createJsonRequest({
        path: '/person',
        body: validData.requestBody,
        query: 'test=hoge',
      })

      // Act: リクエストを実行
      const res = await app.request(req)

      // Assert: クエリパラメータが無視されていることを検証
      expect(res.status).toBe(200)
      expect(await res.json()).toStrictEqual({
        success: true,
        data: validData.requestBody,
        query: {},
      })
    })
  })

  describe('ヘッダーバリデーション', () => {
    const app = new Hono()

    // biome-ignore format:
    app.get(
      '/secure',
      effectValidator('header', schemas.header),
      (c) => {
        const header = c.req.valid('header')
        return c.json({
          success: true,
          header,
        })
      }
    )

    /**
     * テスト用のヘッダー付きリクエストを作成するヘルパー関数
     * @param headers - リクエストヘッダー
     * @returns Request - 設定されたリクエストオブジェクト
     */
    const createHeaderRequest = (headers = {}) => {
      return new Request('http://localhost/secure', {
        method: 'GET',
        headers,
      })
    }

    it('ヘッダーのバリデーションが成功する場合に、正常にレスポンスが返されること', async () => {
      expect.assertions(2)
      // Arrange: 有効なヘッダーを準備
      const req = createHeaderRequest({
        'X-Api-Key': validData.header['X-Api-Key'],
      })

      // Act: リクエストを実行
      const res = await app.request(req)

      // Assert: レスポンスの検証
      expect(res.status).toBe(200)
      expect(await res.json()).toStrictEqual({
        success: true,
        header: {
          'X-Api-Key': validData.header['X-Api-Key'],
        },
      })
    })

    it('ヘッダー名は大文字小文字を区別しない', async () => {
      expect.assertions(2)
      // Arrange: 小文字のヘッダー名を準備
      const req = createHeaderRequest({
        'x-api-key': validData.header['X-Api-Key'],
      })

      // Act: リクエストを実行
      const res = await app.request(req)

      // Assert: 大文字小文字を区別せずに処理されることを検証
      expect(res.status).toBe(200)
      expect(await res.json()).toStrictEqual({
        success: true,
        header: {
          'X-Api-Key': validData.header['X-Api-Key'],
        },
      })
    })

    it('ヘッダーのバリデーションが失敗する場合に、エラーレスポンスが返されること', async () => {
      expect.assertions(2)
      // Arrange: ヘッダーが不足したリクエストを準備
      const req = createHeaderRequest()

      // Act: リクエストを実行
      const res = await app.request(req)

      // Assert: エラーレスポンスの検証
      expect(res.status).toBe(400)
      expect(await res.json()).toStrictEqual({
        success: false,
        error: [{ _tag: 'Missing', message: 'is missing', path: ['X-Api-Key'] }],
      })
    })
  })

  describe('カスタムフック', () => {
    const app = new Hono()

    app.post(
      '/with-hook',
      effectValidator('json', schemas.requestBody, (result, c) => {
        if (!result.success) {
          return c.json(
            {
              customError: true,
              message: 'カスタムエラーメッセージ',
            },
            422,
          )
        }
      }),
      (c) => {
        const data = c.req.valid('json')
        return c.json({
          success: true,
          data,
        })
      },
    )

    it('カスタムフックを使用した場合に、フックが定義したレスポンスが返されること', async () => {
      expect.assertions(2)
      // Arrange: 無効なリクエストボディを準備
      const invalidBody = { ...validData.requestBody, age: 'invalid' }
      const req = createJsonRequest({
        path: '/with-hook',
        body: invalidBody,
      })

      // Act: リクエストを実行
      const res = await app.request(req)

      // Assert: カスタムエラーレスポンスの検証
      expect(res.status).toBe(422)
      expect(await res.json()).toStrictEqual({
        customError: true,
        message: 'カスタムエラーメッセージ',
      })
    })
  })
})
