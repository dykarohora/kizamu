import { Schema, Effect } from 'effect'
import { DeckSchema } from './model'

describe('DeckSchema', () => {
  // 有効なデッキデータ
  const validDeckData = {
    id: 'deck-123',
    name: 'テスト用デッキ',
    description: 'これはテスト用のデッキです',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  test('有効なデータの場合、パースが成功すること', async () => {
    // Arrange
    const input = validDeckData

    // Act
    const parseResult = Schema.decodeUnknown(DeckSchema)(input)
    const result = await Effect.runPromise(parseResult)

    // Assert
    expect(result).toBeDefined()
    expect(result.id).toBe(validDeckData.id)
    expect(result.name).toBe(validDeckData.name)
    expect(result.description).toBe(validDeckData.description)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })

  test('idが空文字の場合、パースが失敗すること', async () => {
    // Arrange
    const invalidData = { ...validDeckData, id: '' }

    // Act
    const parseResult = Schema.decodeUnknown(DeckSchema)(invalidData)

    // Assert
    await expect(Effect.runPromise(parseResult)).rejects.toThrow()
  })

  test('nameが空文字の場合、パースが失敗すること', async () => {
    // Arrange
    const invalidData = { ...validDeckData, name: '' }

    // Act
    const parseResult = Schema.decodeUnknown(DeckSchema)(invalidData)

    // Assert
    await expect(Effect.runPromise(parseResult)).rejects.toThrow()
  })

  test('descriptionが空文字の場合、パースが失敗すること', async () => {
    // Arrange
    const invalidData = { ...validDeckData, description: '' }

    // Act
    const parseResult = Schema.decodeUnknown(DeckSchema)(invalidData)

    // Assert
    await expect(Effect.runPromise(parseResult)).rejects.toThrow()
  })
})
