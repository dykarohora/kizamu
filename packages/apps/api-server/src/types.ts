import type { Simplify } from 'effect/Types'
import type { CreateCardRoute } from './routes/cards/createCardRoute'
import type { GetCardsByDeckIdRoute } from './routes/cards/getCardsByDeckIdRoute'
import type { CreateDeckRoute } from './routes/decks/createDeckRoute'
import type { GetDecksRoute } from './routes/decks/getDecksRoute'
import type { GetDeckByIdRoute } from './routes/decks/getDeckByIdRoute'

export type ApiServerType = Simplify<
  CreateDeckRoute | GetDecksRoute | CreateCardRoute | GetCardsByDeckIdRoute | GetDeckByIdRoute
>
