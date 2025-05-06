import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/dashboard": {};
  "/decks/new": {};
  "/decks/:deckId": {
    "deckId": string;
  };
  "/decks/:deckId/cards/new": {
    "deckId": string;
  };
  "/decks/:deckId/study": {
    "deckId": string;
  };
  "/decks/:deckId/cards/:cardId": {
    "deckId": string;
    "cardId": string;
  };
  "/login": {};
  "/logout": {};
  "/callback": {};
};