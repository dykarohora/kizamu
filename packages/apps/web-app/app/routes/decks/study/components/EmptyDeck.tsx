import { useFetcher } from 'react-router'
import { css } from 'styled-system/css'
import { Button } from '~/shared/components/ui/button'

interface EmptyDeckProps {
  deckId: string
}
/**
 * 学習対象のカードがない場合に表示するコンポーネント
 *
 * @description
 * デッキ内に学習対象のカードが存在しない場合に、ユーザーに情報を提供し、
 * ダッシュボードに戻るための選択肢を提供します。これは以下の状況で発生する可能性があります：
 * - 新しく作成されたデッキでカードがまだ追加されていない
 * - すべてのカードが学習間隔の条件を満たしていない
 * - データ取得中にエラーが発生した
 *
 * @returns {JSX.Element} 空のデッキ表示コンポーネント
 */
export const EmptyDeck = ({ deckId }: EmptyDeckProps) => {
  const fetcher = useFetcher()

  return (
    <div className={css({ padding: '6', textAlign: 'center' })}>
      {/* ユーザーに状況を説明するメッセージ */}
      <p>学習対象のカードがありません。</p>

      {/* ユーザーがダッシュボードに簡単に戻れるようにするナビゲーションボタン */}
      <fetcher.Form method="post" action={`/decks/${deckId}/study?completed=true`}>
        <Button>デッキ一覧に戻る</Button>
      </fetcher.Form>
    </div>
  )
}
