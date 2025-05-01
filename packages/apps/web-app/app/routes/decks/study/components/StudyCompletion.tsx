import { css } from 'styled-system/css'
import { Button } from '~/shared/components/ui/button'
import { useFetcher } from 'react-router'

/**
 * StudyCompletionコンポーネントのプロパティ型定義
 *
 * @property deckId - 学習を完了したデッキのID
 */
interface StudyCompletionProps {
  deckId: string
}

/**
 * 学習完了時の表示コンポーネント
 *
 * @description
 * デッキ内のすべてのカードの学習が完了した際に表示される祝福画面です。
 * 学習の達成感を演出し、ユーザーに学習完了のフィードバックを提供します。
 * また、ダッシュボードに戻るためのアクションボタンも提供します。
 *
 * このコンポーネントが表示される際、学習セッションの終了処理として
 * セッションストレージのクリーンアップが親コンポーネントで実行されます。
 *
 * @param {StudyCompletionProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} 学習完了画面コンポーネント
 */
export const StudyCompletion = ({ deckId }: StudyCompletionProps) => {
  /**
   * React Routerのfetcherインスタンス
   * デッキ一覧画面へのリダイレクト処理に使用
   */
  const fetcher = useFetcher()

  return (
    <div className={css({ padding: '6', maxWidth: '600px', margin: '0 auto', textAlign: 'center' })}>
      {/* 学習完了の祝福メッセージ */}
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '6' })}>すべてのカードの学習が完了しました！🎉</h1>

      {/* 補足説明 */}
      <p className={css({ mb: '8' })}>お疲れ様でした！学習結果は記録されました。</p>

      {/* ダッシュボードに戻るためのフォーム - 完了パラメータを含むPOSTリクエストを送信 */}
      <fetcher.Form method="post" action={`/decks/${deckId}/study?completed=true`}>
        <Button>デッキ一覧に戻る</Button>
      </fetcher.Form>
    </div>
  )
}
