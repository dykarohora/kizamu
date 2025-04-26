import type { Simplify } from 'effect/Types'
import type { CreateDeckRoute } from './routes/decks/createDeckRoute'
import type { GetDecksRoute } from './routes/decks/getDecksRoute'
import type { CreateCardRoute } from './routes/cards/createCardRoute'

export type ApiServerType = Simplify<CreateDeckRoute | GetDecksRoute | CreateCardRoute>
