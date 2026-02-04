import * as Scry from "scryfall-sdk"

export enum ClientCommand {
  poll = "poll",
  settings = "settings",
  guess = "guess",
  end = "end",
  rematch = "rematch",
  use = "use"
}

export type Player = {
  name : string,
  kitId : number,
  points: number,
  itemIdUses: Array<Array<number>>
}

export type LobbyInfo = {
  code: string,
  name: string,
  format: string,
  kitId: number,
  itemIds: Array<number>
}

export class GameState {
  guessedCards: Array<Scry.Card> = []
  activePlayer: 0 | 1 = 0
  players: Array<Player> = []
  endsAt: Date | null = null
  startsAt: Date = new Date()
  rematch: Array<boolean> = [false, false]
  toast?: string = ""
  format: keyof Scry.Legalities | "" = ""
  winner: -1 | 0 | 1 = -1
  phase: number = 0
}

export class GameStateHelpers {

  static pushCard(card : Scry.Card, state : GameState) {
    state.guessedCards.push(card)
    state.activePlayer = (state.activePlayer ^ 1) as 0 | 1
    state.startsAt = new Date()
    state.endsAt = new Date(state.startsAt.getTime() + 20 * 1000)
    return state
  }

  static async pushRandomCard(state : GameState)
  {
    const random = await Scry.Cards.random(`format:${state.format} -type:land`)
    if(random)
    {
      state.guessedCards = [...state.guessedCards, random] 
    }
    return state
  } 

  static isLegalPlay(guess : Scry.Card, state : GameState) : boolean 
  {
    //need to address pathways
    if(guess.type_line.includes("Land") && !guess.card_faces)
    {
      return false
    }
    
    const guessedCards = state.guessedCards

    if(guessedCards.reduce((acc, ele) => (acc || guess.name == ele.name), false))
    {
      return false
    } 

    const format = state.format as keyof typeof guess.legalities
    if (!guess.isLegal(format)) {
      return false
    }

    if(guessedCards.length == 0)
    {
      return true
    }

    const previousGuess = guessedCards[guessedCards.length - 1]

    if(previousGuess.set === guess.set)
    {
      return true
    }

    if(previousGuess.cmc == guess.cmc)
    {
      return true
    }

    if(previousGuess.power)
    {
      if(previousGuess.power == guess.power)
      {
        return true
      }else if (previousGuess.toughness == guess.toughness)
      {
        return true
      }
    }

    return false
  }

}