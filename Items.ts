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
    const index = oldState.players[wsId].itemIdUses.findIndex((e) => e[0] == ESCAPE.id && e[1] > 0)
    oldState.players[wsId].itemIdUses[index][1] -= 1
    oldState = await GameStateHelpers.pushRandomCard(oldState)

    return { 
        lastGuessTimeStamp: new Date(),
        guessedCards: oldState.guessedCards,
        activePlayer: (oldState.activePlayer ^ 1) as 0 | 1,
        players: oldState.players,
        toast: `${oldState.players[wsId].name} escaped!`,
    } as Partial<GameState>
  },
  maxUses: 1,
  id: 0
}

export const DELAY : Item = {
    name: "Delay",
    use: async (oldState : GameState, wsId : number) => {
        if(!oldState.endsAt)
        {
            return {} 
        }

        const index = oldState.players[wsId].itemIdUses.findIndex((e) => e[0] == DELAY.id && e[1] > 0)
        oldState.players[wsId].itemIdUses[index][1] -= 1
        oldState.endsAt.setSeconds(oldState.endsAt.getSeconds() + 5)
        return { 
            toast: `${oldState.players[wsId].name} delayed the timer!`,
            endsAt: oldState.endsAt,
            players: oldState.players
        } as Partial<GameState>
    },
    maxUses: 2,
    id: 1
}

export const BLOCK : Item = {
    name: "Block",
    use: async (oldState : GameState, wsId : number ) => {
        if(oldState.activePlayer == wsId)
        {
            //can't block yourself
            return {} as Partial<GameState>
        }

        const index = oldState.players[wsId].itemIdUses.findIndex((e) => e[0] == BLOCK.id && e[1] > 0)
        oldState.players[wsId].itemIdUses[index][1] -= 1
        return {
            isBlocked: true,
            toast: `${oldState.players[wsId].name} blocked win conditions this turn!`,
            players: oldState.players
        } as Partial<GameState>
    },
    maxUses: 1,
    id: 2
}

export const ALL_ITEMS : Array<Item> = [ESCAPE, DELAY, BLOCK]