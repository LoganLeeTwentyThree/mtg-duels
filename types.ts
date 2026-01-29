import * as Scry from "scryfall-sdk"

export enum ClientCommand {
  poll = "poll",
  settings = "settings",
  guess = "guess",
  end = "end",
  rematch = "rematch"
}

export enum ServerCommand {
  update = "update", 
  settings = "settings",
  push = "push"
}

export type Player = {
  name : string,
  kitId : number,
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

export interface Kit {

    name: string,
    isWin(card: Scry.Card, format?: keyof Scry.Legalities): boolean,
    points: number,
    id: number
}

export interface Item {
  name: string,
  use(): void,
  uses: number,
}

export const CREATURES : Kit = {
  name: "Creatures", 
  isWin: card => card.type_line.includes("Creature"),
  points: 10,
  id: 0
}

export const INSTANTS : Kit = {
  name: "Instants", 
  isWin: card => card.type_line.includes("Instant"),
  points: 6,
  id: 1
}

export const SORCERIES : Kit = {
  name: "Sorceries", 
  isWin: card => card.type_line.includes("Sorcery"),
  points: 6,
  id: 2
}

export const ENCHANTMENTS : Kit = {
  name: "Enchantments", 
  isWin: card => card.type_line.includes("Enchantment"),
  points: 5,
  id: 3
}

export const ARTIFACTS : Kit = {
  name: "Artifacts", 
  isWin: card => card.type_line.includes("Artifact"),
  points: 5,
  id: 4
}

export const PLANESWALKERS : Kit = {
  name: "Planeswalkers", 
  isWin: card =>card.type_line.includes("Planeswalker"),
  points: 4,
  id: 5
}

export const BANNED_AND_RESTRICTED : Kit = {
  name: "Banned and Restricted",
  isWin: (card, format) => !!format &&
    (card.legalities[format] === "banned" ||
     card.legalities[format] === "restricted"),
  points: 3,
  id: 6
}
  
export const REPRINTS : Kit = {name: "Reprints", isWin: card => card.reprint, points: 3, id: 7}

export const ALL_KITS : Array<Kit> = [CREATURES, INSTANTS, SORCERIES, ENCHANTMENTS, ARTIFACTS, PLANESWALKERS, BANNED_AND_RESTRICTED, REPRINTS]