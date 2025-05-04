import type { Simplify } from 'effect/Types'
import type { CreateCardRoute } from './routes/cards/createCardRoute'
import type { GetCardsByDeckIdRoute } from './routes/cards/getCardsByDeckIdRoute'
import type { CreateDeckRoute } from './routes/decks/createDeckRoute'
import type { GetDeckByIdRoute } from './routes/decks/getDeckByIdRoute'
import type { GetDecksRoute } from './routes/decks/getDecksRoute'
import type { GetStudyCardsRoute } from './routes/study/getStudyCardsRoute'
import type { RecordStudyResultRoute } from './routes/study/recordStudyResultRoute'
import type { DeleteCardByIdRoute } from './routes/cards/deleteCardByIdRoute'

// biome-ignore format:
export type ApiServerType = Simplify<
  CreateDeckRoute | 
  GetDecksRoute | 
  CreateCardRoute |
  GetCardsByDeckIdRoute |
  GetStudyCardsRoute |
  GetDeckByIdRoute |
  RecordStudyResultRoute |
  DeleteCardByIdRoute
>
