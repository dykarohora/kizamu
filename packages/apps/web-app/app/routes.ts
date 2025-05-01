import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  layout('routes/layouts/MainLayout.tsx', [
    index('routes/Home.tsx'),
    route('/dashboard', 'routes/dashboard/Dashboard.tsx'),
    route('/decks/new', 'routes/decks/new/CreateDeck.tsx'),
    route('/decks/:deckId', 'routes/decks/detail/DeckDetail.tsx'),
    route('/decks/:deckId/cards/new', 'routes/cards/new/CreateCard.tsx'),
    route('/decks/:deckId/study', 'routes/decks/study/Study.tsx'),
  ]),
  route('/login', 'routes/auth/Login.tsx'),
  route('/logout', 'routes/auth/Logout.tsx'),
  route('/callback', 'routes/auth/Callback.tsx'),
] satisfies RouteConfig
