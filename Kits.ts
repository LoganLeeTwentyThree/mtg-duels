import * as Scry from "scryfall-sdk"

export interface Kit {
    name: string,
    isWin(card: Scry.Card, format?: keyof Scry.Legalities): boolean,
    readonly points: number,
    readonly id: number
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

