import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { Button } from '~/shared/components/ui/button'
import * as Dialog from '~/shared/components/ui/styled/dialog'

export type DeleteCardDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * カード削除確認ダイアログ
 * @description
 * カードの削除前に確認を表示するダイアログコンポーネント
 */
export const DeleteCardDialog = ({ isOpen, onClose, onConfirm }: DeleteCardDialogProps) => (
  <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onClose()}>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>
        <div className={css({ p: '6' })}>
          <Dialog.Title>カードを削除しますか？</Dialog.Title>
          <Dialog.Description className={css({ mt: '2', mb: '6' })}>
            このカードを削除すると元に戻せません。削除してもよろしいですか？
          </Dialog.Description>

          <div className={flex({ justifyContent: 'flex-end', gap: '3' })}>
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              variant="solid"
              colorPalette="red"
              onClick={() => {
                onConfirm()
                onClose()
              }}
            >
              削除する
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Root>
)
