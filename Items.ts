import { GameState, GameStateHelpers } from "./Protocol"

export interface Item {
  name: string,
  use(oldState: GameState,  wsId : number): Promise<Partial<GameState>>,
  readonly maxUses: number,
  readonly id: number
}

export const ESCAPE : Item = {
  name: "Escape",
  use: async (oldState : GameState, wsId : number) => {
    oldState.players[wsId].itemIdUses[ESCAPE.id][1] -= 1
    oldState = await GameStateHelpers.pushRandomCard(oldState)

    return { 
        guessedCards: oldState.guessedCards,
        activePlayer: (oldState.activePlayer ^ 1) as 0 | 1,
        players: oldState.players.map((e, i) => {
            if(i == wsId)
            {
                return {...e, itemIdUses: oldState.players[wsId].itemIdUses} 
            }else
            {
                return e
            }
        }),
    } as Partial<GameState>
  },
  maxUses: 1,
  id: 0
}

export const ALL_ITEMS : Array<Item> = [ESCAPE]