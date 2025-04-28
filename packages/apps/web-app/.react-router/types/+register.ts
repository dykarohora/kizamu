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
  "/login": {};
  "/callback": {};
};