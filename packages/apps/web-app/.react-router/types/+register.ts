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
  "/login": {};
  "/callback": {};
};