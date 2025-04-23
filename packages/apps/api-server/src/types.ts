import type { Simplify } from 'effect/Types'
import type { CreateDeckRoute } from './routes/decks/createDeckRoute'
import type { GetDecksRoute } from './routes/decks/getDecksRoute'

export type ApiServerType = Simplify<CreateDeckRoute | GetDecksRoute>
