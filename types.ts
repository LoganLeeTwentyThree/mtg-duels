import * as Scry from "scryfall-sdk"

export type Player = {
  name : string,
  kit : string,
  points: number,
}

export class GameState {
  guessedCards: Array<Scry.Card> = []
  activePlayer: 0 | 1 = 0
  players: Array<Player> = []
  lastGuessTimeStamp: Date | null = null
  rematch: Array<boolean> = [false, false]
  toast?: string = ""
  format: keyof Scry.Legalities | "" = ""
  winner: -1 | 0 | 1 = -1
}

export class Kit {
  constructor(
    public name: string,
    public isWin: (card: Scry.Card, format?: keyof Scry.Legalities) => boolean,
    public points: number,
  ) {}
}

export const CREATURES = new Kit("Creatures", card =>
  card.type_line.includes("Creature"),
  10
)

export const INSTANTS = new Kit("Instants", card =>
  card.type_line.includes("Instant"),
  6
)

export const SORCERIES = new Kit("Sorceries", card =>
  card.type_line.includes("Sorcery"),
  6
)

export const ENCHANTMENTS = new Kit("Enchantments", card =>
  card.type_line.includes("Enchantment"),
  5
)

export const ARTIFACTS = new Kit("Artifacts", card =>
  card.type_line.includes("Artifact"),
  5
)

export const PLANESWALKERS = new Kit("Planeswalkers", card =>
  card.type_line.includes("Planeswalker"),
  4
)

export const BANNED_AND_RESTRICTED = new Kit(
  "Banned and Restricted",
  (card, format) =>
    !!format &&
    (card.legalities[format] === "banned" ||
     card.legalities[format] === "restricted"),
     3
)

export const REPRINTS = new Kit("Reprints", card => card.reprint, 3)

export const NAME_TO_KIT : Map<string, Kit> = new Map([
    ["Creatures", CREATURES], 
    ["Instants", INSTANTS], 
    ["Sorceries", SORCERIES], 
    ["Enchantments", ENCHANTMENTS], 
    ["Artifacts", ARTIFACTS],
    ["Planeswalkers", PLANESWALKERS],
    ["Banned and Restricted", BANNED_AND_RESTRICTED],
    ["Reprints", REPRINTS]
])
