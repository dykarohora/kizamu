# データベース設計書

データベースはPostgreSQL互換のSupabaseを使用する

## 1. テーブル定義

### 1.1 users
ユーザー情報を管理するテーブル

| カラム名 | 型 | NULL | デフォルト値 | 説明 |
|---------|-----|------|------------|------|
| id | TEXT | NO | - | プライマリーキー、UUID |
| name | TEXT | NO | - | ユーザー名 |
| created_at | TIMESTAMP | NO | - | 作成日時（UTC） |
| updated_at | TIMESTAMP | NO | - | 更新日時（UTC） |

### 1.2 decks
フラッシュカードのデッキを管理するテーブル

| カラム名 | 型 | NULL | デフォルト値 | 説明 |
|---------|-----|------|------------|------|
| id | TEXT | NO | - | プライマリーキー、UUID |
| created_by | TEXT | NO | - | 作成者のID（外部キー） |
| name | TEXT | NO | - | デッキ名 |
| description | TEXT | NO | '' | デッキの説明 |
| created_at | TIMESTAMP | NO | - | 作成日時（UTC） |
| updated_at | TIMESTAMP | NO | - | 更新日時（UTC） |

インデックス：
- `created_by`: 検索用

### 1.3 cards
フラッシュカードのコンテンツを管理するテーブル

| カラム名 | 型 | NULL | デフォルト値 | 説明 |
|---------|-----|------|------------|------|
| id | TEXT | NO | - | プライマリーキー、UUID |
| deck_id | TEXT | NO | - | 所属するデッキのID（外部キー） |
| front_content | TEXT | NO | - | カード表面のテキストコンテンツ |
| back_content | TEXT | NO | - | カード裏面のテキストコンテンツ |
| created_at | TIMESTAMP | NO | - | 作成日時（UTC） |
| updated_at | TIMESTAMP | NO | - | 更新日時（UTC） |

インデックス：
- `deck_id`: 検索用

### 1.4 card_images
カードの画像を管理するテーブル

| カラム名 | 型 | NULL | デフォルト値 | 説明 |
|---------|-----|------|------------|------|
| id | TEXT | NO | - | プライマリーキー、UUID |
| card_id | TEXT | NO | - | カードID（外部キー） |
| side | TEXT | NO | - | 画像の配置面（'front' または 'back'） |
| image_key | TEXT | NO | - | R2オブジェクトキー |
| created_at | TIMESTAMP | NO | - | 作成日時（UTC） |

インデックス：
- `card_id`: 検索用
- `(card_id, side)`: UNIQUE（1つの面に1つの画像のみ）

### 1.5 tags
タグを管理するテーブル

| カラム名 | 型 | NULL | デフォルト値 | 説明 |
|---------|-----|------|------------|------|
| id | TEXT | NO | - | プライマリーキー、UUID |
| name | TEXT | NO | - | タグ名 |
| created_at | TIMESTAMP | NO | - | 作成日時（UTC） |

インデックス：
- `name`: UNIQUE

### 1.6 card_tags
カードとタグの関連を管理する中間テーブル

| カラム名 | 型 | NULL | デフォルト値 | 説明 |
|---------|-----|------|------------|------|
| card_id | TEXT | NO | - | カードID（外部キー） |
| tag_id | TEXT | NO | - | タグID（外部キー） |

プライマリーキー：
- `(card_id, tag_id)`の複合キー

### 1.7 study_events
学習履歴を管理するテーブル

| カラム名 | 型 | NULL | デフォルト値 | 説明 |
|---------|-----|------|------------|------|
| id | TEXT | NO | - | プライマリーキー、UUID |
| deck_id | TEXT | NO | - | 学習したデッキのID（外部キー） |
| studied_by | TEXT | NO | - | 学習したユーザーのID（外部キー） |
| card_id | TEXT | NO | - | 学習したカードのID（外部キー） |
| grade | INTEGER | NO | - | 学習結果（0-5のSM-2評価） |
| studied_at | TIMESTAMP | NO | - | 学習日時（UTC） |

インデックス：
- `deck_id`: 検索用
- `studied_by, studied_at`: 学習パターン分析用
- `card_id`: 検索用

### 1.8 card_learning_states
カードの学習状態を管理するテーブル

| カラム名 | 型 | NULL | デフォルト値 | 説明 |
|---------|-----|------|------------|------|
| card_id | TEXT | NO | - | カードID（外部キー） |
| studied_by | TEXT | NO | - | 学習者のID（外部キー） |
| ease_factor | REAL | NO | 2.5 | SM-2アルゴリズムの易しさ係数 |
| interval | INTEGER | NO | 0 | SM-2アルゴリズムの間隔（日数） |
| next_study_date | TIMESTAMP | NO | - | 次回学習日（UTC） |
| created_at | TIMESTAMP | NO | - | 作成日時（UTC） |
| updated_at | TIMESTAMP | NO | - | 更新日時（UTC） |

プライマリーキー：
- `(card_id, studied_by)`の複合キー

インデックス：
- `studied_by`: 検索用
- `next_study_date`: 学習カード取得用

## 2. 外部キー制約

### 2.1 decks
| 外部キー | 参照先 | ON DELETE | ON UPDATE | 説明 |
|---------|--------|-----------|-----------|------|
| created_by | users(id) | CASCADE | CASCADE | ユーザーが削除された場合、関連するデッキも削除 |

### 2.2 cards
| 外部キー | 参照先 | ON DELETE | ON UPDATE | 説明 |
|---------|--------|-----------|-----------|------|
| deck_id | decks(id) | CASCADE | CASCADE | デッキが削除された場合、関連するカードも削除 |

### 2.3 card_images
| 外部キー | 参照先 | ON DELETE | ON UPDATE | 説明 |
|---------|--------|-----------|-----------|------|
| card_id | cards(id) | CASCADE | CASCADE | カードが削除された場合、関連する画像も削除 |

### 2.4 card_tags
| 外部キー | 参照先 | ON DELETE | ON UPDATE | 説明 |
|---------|--------|-----------|-----------|------|
| card_id | cards(id) | CASCADE | CASCADE | カードが削除された場合、関連するタグ紐付けも削除 |
| tag_id | tags(id) | CASCADE | CASCADE | タグが削除された場合、関連するカードとの紐付けも削除 |

### 2.5 card_learning_states
| 外部キー | 参照先 | ON DELETE | ON UPDATE | 説明 |
|---------|--------|-----------|-----------|------|
| card_id | cards(id) | CASCADE | CASCADE | カードが削除された場合、関連する学習状態も削除 |
| studied_by | users(id) | CASCADE | CASCADE | ユーザーが削除された場合、関連する学習状態も削除 |

## 3. 削除時の動作フロー

### 3.1 ユーザーを削除した場合
1. ユーザーの削除
2. → デッキの削除（CASCADE）
3. → カードの削除（CASCADE）
4. → カード画像の削除（CASCADE）
5. → カードタグ紐付けの削除（CASCADE）
6. → 学習履歴の削除（CASCADE）

### 3.2 デッキを削除した場合
1. デッキの削除
2. → カードの削除（CASCADE）
3. → カード画像の削除（CASCADE）
4. → カードタグ紐付けの削除（CASCADE）
5. → 学習履歴の削除（CASCADE）

### 3.3 カードを削除した場合
1. カードの削除
2. → カード画像の削除（CASCADE）
3. → カードタグ紐付けの削除（CASCADE）
4. → 学習履歴の削除（CASCADE）

### 3.4 タグを削除した場合
1. タグの削除
2. → カードタグ紐付けの削除（CASCADE）

## 4. データ削除時の補足処理

### 4.1 R2オブジェクトの削除
`card_images`テーブルのレコードが削除される際、以下の処理をアプリケーション側で実装する：

1. トリガー
   - `card_images`テーブルの削除操作をフック
   - バッチ処理による孤立オブジェクトの定期チェック（バックアップ）

2. 削除処理フロー
   ```mermaid
   sequenceDiagram
       participant App as アプリケーション
       participant DB as データベース
       participant R2 as R2ストレージ
       
       App->>DB: レコード削除要求
       DB-->>App: 削除完了通知
       App->>R2: 対応する画像ファイル削除
       R2-->>App: 削除完了通知
   ```

3. エラーハンドリング
   - R2オブジェクトの削除に失敗した場合でもデータベーストランザクションはロールバックしない
   - 削除失敗したオブジェクトは定期バッチで再度削除を試みる 