# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Kizamu プロジェクト開発ガイド

## プロジェクト概要

Kizamuは間隔反復学習（SM-2アルゴリズム）を使用したフラッシュカード学習Webアプリケーションです。サーバーレスアーキテクチャによりCloudflare Workers上で動作します。

**技術スタック:**
- フロントエンド: React Router v7（Cloudflare Workers上）
- バックエンド: Hono API（Cloudflare Workers上）
- データベース: Supabase（PostgreSQL互換）
- ストレージ: Cloudflare R2
- 認証: Auth0
- スタイリング: Panda CSS + Park UIコンポーネント
- モノレポ: PNPM workspaces + Turbo

## プロジェクト構造

```
packages/
├── apps/
│   ├── web-app/          # React Router v7 フロントエンド
│   └── api-server/       # Hono API バックエンド
└── libs/
    ├── db/               # データベース層（Drizzle ORM）
    └── schema/           # TypeScriptスキーマ（Effect Schema）
```

## 必須コマンド

### 開発

```bash
# 開発サーバー起動
pnpm web-app dev          # フロントエンド（localhost:5173）
pnpm api-server dev       # APIサーバー（dotenvx使用）

# ビルド
pnpm build               # Turbo経由で全パッケージビルド

# コード品質（コミット前に必須実行）
pnpm lint:fix            # 全パッケージのリント修正
pnpm web-app typecheck   # web-appの型チェック
pnpm api-server typecheck # api-serverの型チェック

# Panda CSS
pnpm web-app prepare     # CSS変更後のPanda CSSスタイル生成
```

### テスト

```bash
# Vitestワークスペース設定でのテスト実行
pnpm test                # 全テスト
pnpm test:coverage       # カバレッジレポート生成

# 個別パッケージテスト
pnpm web-app test        # web-appのみ
pnpm api-server test     # api-serverのみ
```

### データベース

```bash
pnpm db migrate          # データベースマイグレーション実行
pnpm db studio           # Drizzle Studio起動
```

### デプロイ

```bash
pnpm web-app deploy:worker     # Cloudflare Workersにフロントエンドデプロイ
pnpm api-server deploy:worker  # Cloudflare Workersにバックエンドデプロイ（staging環境）
```

## 開発規約

### コード実装規約

- **既存コード参照**: 常に既存のコード構造や記法を参考にする
- **コメント**: 関数のインタフェースと内部実装に目的・背景がわかるコメントを残す
- **関数命名**: 「何をするか」ではなく「何が起きるか」「何を目的とするか」を表現
- **型付け**: 関数シグネチャと内部変数の型付けを積極的に実行
- **引数オブジェクト**: 引数が2つ以上の場合はオブジェクト引数を使用（インライン型定義）
- **段階的実装**: 
  1. 関数シグネチャ（名前、引数型、戻り値型）を先に作成して確認
  2. 合意後に内部実装
- **設計原則**: SOLID原則（特に単一責任の原則）を遵守

### テスト実装規約

- **テスト設計**: 
  - テストケース名: 「{事前条件}の場合に{操作}をすると{結果}になること」形式
  - Arrange-Act-Assertの3ステップ構造（境界にコメント追加）
  - 基本テスト技法使用（同値分割法、境界値分析、デシジョンテーブル、ステートベーステスト）
- **段階的実装**:
  1. テスト対象コード確認
  2. テストケース名を先に出力して確認
  3. Assert部を先に作成して確認
  4. Arrange、Act部を実装
- **必須要素**:
  - `expect.assertions(n)`でアサーション数を明示
  - パラメータライズドテスト使用（類似パターンの異なる入力値）

## Effect-tsライブラリ実装パターン

### 基本型定義

```typescript
interface Effect<Success, Failure = never, Requirements = never>
```

- **Success**: 成功時の戻り値型
- **Failure**: 失敗時のエラー型（`never`は失敗しない計算）
- **Requirements**: 依存する外部サービス型（`never`は依存なし）

### Effect作成パターン

```typescript
// 非同期操作Effect
const fetchData = (id: string): Effect.Effect<Data, CustomError> =>
  Effect.tryPromise({
    try: async () => {
      // 非同期処理
      return result
    },
    catch: reason => new CustomError(reason)
  })

// エラー型定義
class NotFoundError extends Data.TaggedError('NotFoundError')<{ id: string }> {}
class ValidationError extends Data.TaggedError('ValidationError')<{ message: string }> {}
type AppError = NotFoundError | ValidationError

// エラーハンドリング
const handleErrors = pipe(
  fetchData(id),
  Effect.catchTags({
    NotFoundError: (error) => handleNotFound(error),
    ValidationError: (error) => handleValidation(error)
  })
)
```

### Dependency Injection

```typescript
// サービスインターフェイス定義
class UserRepository extends Context.Tag('UserRepository')<
  UserRepository,
  (userId: string) => Effect.Effect<User, Error>
>() {}

// 依存関係を持つEffect
const getUserUseCase = (id: string): Effect.Effect<User, NotFoundError, UserRepository> =>
  pipe(
    UserRepository,
    Effect.flatMap(repo => repo.findById(id))
  )

// 依存関係注入
const UserRepositoryLive = Context.make(UserRepository, {
  findById: (id) => /* 実装 */
})

const program = pipe(
  getUserUseCase(id),
  Effect.provide(UserRepositoryLive)
)
```

## フロントエンド設計（React Router v7）

### ルート構造（機能ベース・コロケーション）

```
routes/
├── dashboard/
│   ├── components/         # 画面専用コンポーネント
│   ├── hooks/              # 画面専用カスタムフック
│   └── dashboard.tsx       # ルートモジュール
├── decks/
│   ├── detail/
│   │   ├── components/
│   │   │   └── Pagination/ # 複雑コンポーネントは専用ディレクトリ
│   │   └── hooks/
│   └── create/
```

### コンポーネント設計原則

- **関数コンポーネント**: アロー関数使用
- **責務分離**: 1コンポーネントあたりフック5個以内制限
- **状態スコープ**: 最小スコープでの状態管理
- **コロケーション**: 関連コード近接配置
- **Deep Modules**: シンプルな外部インターフェース、複雑な内部実装
- **パフォーマンス**: 状態変更の影響範囲最小化でのre-render最適化

### React Router v7 + Effect統合

- **ローダー・アクション**: EffectシステムとReact Router v7統合
- **型安全性**: Effectの型安全性とエラーハンドリング適用
- **認証統合**: `requireAuth`関数での保護ルート実装

```typescript
// 認証状態取得
export const loader = effectLoader(
  Effect.gen(function* () {
    const { getAuthStatus } = yield* OAuth2Service
    const authStatus = yield* getAuthStatus
    return yield* Effect.succeed(data({ authStatus }))
  })
)

// 認証保護ルート
export const loader = effectLoader(
  pipe(
    requireAuth('/login'), // 未認証時/loginリダイレクト
    Effect.flatMap(user => fetchUserData(user.id))
  )
)
```

## スタイリング（Panda CSS）

### セマンティックトークン使用

- **Background**: `bg.default`、`bg.subtle`、`bg.muted`など
- **Foreground**: `fg.default`、`fg.muted`、`fg.subtle`など
- **Border**: `border.default`、`border.muted`など
- **Accent**: `colorPalette.default`、`colorPalette.emphasized`など

### カラーパレット制限

- グレー（gray）とアクセントカラー（colorPalette）のみ使用
- Radix Colors準拠の12段階色調システム
- コンポーネントとスタイルの同一ファイル内配置

## データベース層（Drizzle ORM + Effect SQL）

### 基本SELECT

```typescript
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import { eq } from 'drizzle-orm'
import { Effect } from 'effect'

export const fetchUserById = (userId: string) =>
  Effect.gen(function* () {
    const db = yield* PgDrizzle
    const result = yield* db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)
    
    if (result.length === 0) {
      return yield* Effect.fail(new NotFoundUserError({ userId }))
    }
    return result[0]
  })
```

### トランザクション

```typescript
import { SqlClient } from '@effect/sql'

export const updateUser = (user) =>
  Effect.gen(function* () {
    const db = yield* PgDrizzle
    const sql = yield* SqlClient.SqlClient
    
    yield* sql.withTransaction(
      Effect.gen(function* () {
        const result = yield* db
          .update(usersTable)
          .set(updateData)
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

## スキーマ定義（Effect Schema）

```typescript
import { Schema } from 'effect'

// スキーマ定義（バリデータ）
export const UserSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  email: Schema.NonEmptyString,
})

// 型エクスポート
export type User = Schema.Schema.Type<typeof UserSchema>
```

## ログ出力

### ログレベル（Effectログモジュール使用）

- `Effect.logFatal`: サービス停止、人手による回復必要
- `Effect.logError`: サービス停止、自動回復可能
- `Effect.logWarning`: 正常処理、不可解事象発生
- `Effect.logInfo`: 正常処理進行記録
- `Effect.logDebug`: 開発時出力

## Git規約

### コミット規約

- **言語**: コミットメッセージは英語必須
- **粒度**: 1コミット1論理変更
- **プレフィックス**: `分類名(パッケージ名):`形式
  - 例: `fix(web-app): resolve authentication issue`
  - 例: `docs: update project overview`

### 分類

- `feat`: 新機能追加
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コード意味に影響しない変更
- `refactor`: バグ修正・機能追加以外のコード変更
- `test`: テスト追加・修正
- `chore`: ビルドプロセス・ツール変更

## 重要注意事項

- **コミット前**: `pnpm lint:fix`必須実行
- **CSS変更後**: `pnpm web-app prepare`でPandaスタイル再生成
- **データベース変更**: Drizzle経由でのマイグレーション必須
- **認証フロー**: Auth0経由、services/auth/内実装確認
- **Effect使用**: すべての副作用・非同期操作・エラーハンドリング