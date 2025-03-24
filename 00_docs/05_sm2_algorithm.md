# SM-2アルゴリズム実装ガイド

## 1. 概要

### 1.1 SM-2アルゴリズムとは
SuperMemoで採用されている間隔反復学習アルゴリズムの一つです。
学習者の自己評価（0-5の6段階）に基づいて、次回の学習間隔を決定します。

### 1.2 基本的な考え方
- 正しく覚えているカードは、より長い間隔で復習
- 間違えたカードは、短い間隔で復習
- 学習者の自己評価に基づいて間隔を調整

## 2. パラメータ

### 2.1 学習者の自己評価（grade）
| 評価 | 意味 |
|------|------|
| 0 | 完全に忘れていた |
| 1 | 間違えたが、見たことはあった |
| 2 | 間違えたが、なんとなく覚えていた |
| 3 | 思い出すのに時間がかかった |
| 4 | 少し迷ったが正解できた |
| 5 | 完璧に覚えていた |

### 2.2 アルゴリズムのパラメータ
- **interval**: 復習間隔（日数）
- **easeFactor**: 易しさ係数（次回の間隔を決める乗数）
- **nextStudyDate**: 次回学習日

## 3. アルゴリズムの流れ

### 3.1 初期値
```typescript
const INITIAL_EASE_FACTOR = 2.5;
const MINIMUM_EASE_FACTOR = 1.3;
const INITIAL_INTERVAL = 0;
```

### 3.2 基本ロジック
1. 評価が3未満の場合
   - intervalを1日目からやり直し
   - easeFactor は変更なし

2. 評価が3以上の場合
   - 初回（interval = 0）: interval = 1
   - 2回目（interval = 1）: interval = 6
   - それ以降: interval = interval * easeFactor

3. easeFactor の更新（評価が3以上の場合のみ）
   ```typescript
   easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
   ```

### 3.3 アルゴリズムのフロー図

```mermaid
flowchart TD
    Start([学習開始]) --> Grade{評価は3以上?}
    
    Grade -->|No| Reset[interval = 1]
    Reset --> Keep[easeFactor は変更なし]
    Keep --> Calc
    
    Grade -->|Yes| First{初回学習?}
    First -->|Yes| Day1[interval = 1]
    First -->|No| Second{2回目?}
    Second -->|Yes| Day6[interval = 6]
    Second -->|No| Multiply[interval = interval * easeFactor]
    
    Day1 --> UpdateEF[easeFactor を更新]
    Day6 --> UpdateEF
    Multiply --> UpdateEF
    
    UpdateEF --> Calc[次回学習日を計算]
    Calc --> End([終了])

    style Start fill:#f9f,stroke:#333
    style End fill:#f9f,stroke:#333
    style Grade fill:#bbf
    style First fill:#bbf
    style Second fill:#bbf
```

```mermaid
graph LR
    subgraph 学習間隔の推移例
        A[1回目] -->|grade ≥ 3| B[2回目: 1日後]
        B -->|grade ≥ 3| C[3回目: 6日後]
        C -->|grade ≥ 3| D[4回目: 6 * EF日後]
        D -->|grade ≥ 3| E[5回目: 前回間隔 * EF]
        
        F[任意の回] -->|grade < 3| G[次回: 1日後]
    end
```

### 3.4 実装例
```typescript
function calculateNextReview(grade: number, oldInterval: number, oldEaseFactor: number) {
  let interval = oldInterval;
  let easeFactor = oldEaseFactor;

  if (grade < 3) {
    // 間違えた場合は最初からやり直し
    interval = 1;
  } else {
    // 正解の場合は間隔を延ばす
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    // 易しさ係数の更新
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    easeFactor = Math.max(MINIMUM_EASE_FACTOR, easeFactor);
  }

  // 次回学習日の計算
  const nextStudyDate = new Date();
  nextStudyDate.setDate(nextStudyDate.getDate() + interval);

  return {
    interval,
    easeFactor,
    nextStudyDate
  };
}
```

## 4. 実装上の注意点

### 4.1 日付の扱い
- 日付計算はUTCで統一
- タイムゾーンの違いを考慮

### 4.2 数値の丸め処理
- intervalは整数に丸める
- easeFactor は小数点第2位まで保持

### 4.3 エッジケース
- 評価が3未満の場合でも、easeFactor は維持
- easeFactor が小さくなりすぎないよう下限値を設定
- 間隔が極端に長くなりすぎないよう上限値の設定を検討

## 5. 参考資料
- [SuperMemo 2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Spaced Repetition](https://en.wikipedia.org/wiki/Spaced_repetition) 
