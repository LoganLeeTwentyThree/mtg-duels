import { DurableObject } from "cloudflare:workers";
import * as Scry from "scryfall-sdk";
import { GameState, ClientCommand, GameStateHelpers } from "../Protocol"
import { ALL_KITS } from "../Kits"
import { ALL_ITEMS } from "../Items"


// i wanted to put all phase stuff in another file, but there was a problem with the imports
export interface Phase {
  id: number, 
  processRequest: (ws: WebSocket, message: ArrayBuffer | string, oldState: GameState, wsId: number) => Promise<Partial<GameState | null>> | null
}

const SETTINGS : Phase = {
  id: 0,
  processRequest: async (ws: WebSocket, message: ArrayBuffer | string, oldState: GameState, wsId: number) =>
  {
    const messageObj = JSON.parse(message as string)

    if(messageObj.command == ClientCommand.poll)
    {
      ws.send(JSON.stringify({gameState: oldState, playerIndex: wsId}))
      return null   
    }

    if(messageObj.command == ClientCommand.settings)
    {
      let newState = 
      {
        format: oldState.format,
        players: oldState.players,
        phase: 0,
        guessedCards: [] as Array<Scry.Card>,
      }
      
      
      if(newState.players.length == 2 && newState.players![wsId ^ 1].kitId > -1)
      {
        newState = await GameStateHelpers.pushRandomCard(newState as GameState)
        
        newState.phase = 1
      }
      
      newState.players[wsId].itemIdUses = messageObj.itemIds.map((e : number) => [e, ALL_ITEMS[e].maxUses])
      newState.players[wsId].kitId = messageObj.kitId 

      if(wsId == 0)//only the host can choose the format
      {
        newState.format = messageObj.format.length == 0 ? "standard" : messageObj.format
      }
      
      return newState
    }
    return null
  }
}

const PLAY : Phase = {
id: 1,
processRequest: async (ws: WebSocket, message: ArrayBuffer | string, oldState: GameState, wsId: number) => {
    const messageObj = JSON.parse(message as string)
    
    if(messageObj.command == ClientCommand.guess)
    {
      if(oldState.activePlayer != wsId)
      {
        return null
      }
      
      const result = Scry.Cards.search(`game:paper !"${messageObj.card}" format:${oldState.format}`).all()
      const guessedCard : Scry.Card | void = ((await result.next()).value)
      
      if(!guessedCard)
      {
        const newState : Partial<GameState> = {toast: `Invalid card`}
        return newState
      }
      
      if(GameStateHelpers.isLegalPlay(guessedCard!, oldState))
      {
        const player = oldState.players[wsId!]
        const newPoints = player.points + ((ALL_KITS[player.kitId]).isWin(guessedCard) ? 1 : 0)
        const isOver = newPoints >= (ALL_KITS[player.kitId].points) ? true : false
        
        const newState : Partial<GameState> = {
          players: oldState.players.map((e, i) => {
              if( i == wsId )
              {
              return {
                ...e,
                points: newPoints,
              }
              }else {
              return e
              }
            }), //important that players stay at same index
          guessedCards: [...oldState.guessedCards, guessedCard],
          startsAt: new Date(),
          endsAt: new Date(new Date().getTime() + 20 * 1000),
          activePlayer : (oldState.activePlayer ^ 1) as 0 | 1,
          toast : "",
          winner: isOver ? wsId as -1 | 0 | 1 : -1,
          phase: isOver ? 2 : 1
        }
        
        return newState
      }else
      {
        const newState : Partial<GameState> = {toast: `Invalid guess: ${guessedCard!.name}`}
        return newState
      }
    }

    if(messageObj.command == ClientCommand.use)
    {
      
      if(wsId != oldState.activePlayer)
      {
        return null
      }
      
      const itemId = messageObj.id
      
      if (oldState.players[wsId].itemIdUses[0][1] <= 0) //hard coded to be first item, need to fix
      {
        return null
      }

      const newGameState = await ALL_ITEMS[itemId].use(oldState, wsId)
      
      return newGameState
      
      
    }

    if(messageObj.command == ClientCommand.end)
    {
      if(oldState.endsAt && new Date().getTime() - oldState.endsAt.getTime() >= 0 && oldState.winner == -1)
      {
        const newState : Partial<GameState> = {
          winner: (oldState.activePlayer ^ 1) as -1 | 0 | 1,
          phase: 2
        }
        
        return newState
      }
    }

    return null 
  }
}

const END : Phase = {
    id: 2,
    processRequest: async (ws, message, oldState, wsId) => 
    {
      const messageObj = JSON.parse(message as string)

      if( messageObj.command != ClientCommand.rematch )
      {
        return null
      }
        
      oldState.rematch[wsId!] = true
      if (oldState.rematch[0] && oldState.rematch[1])
      {
        let newGame: GameState = {
            ...oldState,
            phase: 1,
            startsAt: new Date(),
            endsAt: null,
            winner: -1,
            guessedCards: [],
            rematch: [false, false],
            activePlayer: (oldState.activePlayer ^ 1) as 0 | 1,
            players: oldState.players.map(p => ({
            ...p,
            itemIdUses: [[p.itemIdUses[0][0], ALL_ITEMS[p.itemIdUses[0][0]].maxUses]], //Fix when multiple items possible
            points: 0,
            })),
        }

        newGame = await GameStateHelpers.pushRandomCard(newGame)
        return newGame
      }

    return oldState
  },
}

const ALL_PHASES : Array<Phase> = [SETTINGS, PLAY, END]


export class MyDurableObject extends DurableObject<Env> {
  currentGameState : GameState 
  sessions : Map<WebSocket, number> = new Map()

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    Scry.setAgent("mtg-duels", "1.0.0")
    const oldState : GameState | null | undefined = this.ctx.storage.kv.get("gamestate")
    //if there is existing state and one or more existing websocket connections
    if(oldState && this.ctx.getWebSockets().length > 0)
    {
      this.currentGameState = oldState
      
      for( const ws of this.ctx.getWebSockets())
      {
        this.sessions.set(ws, ws.deserializeAttachment())
      }
    }else {
      this.currentGameState = new GameState()
    }
  }

  async getPlayers() : Promise<number>
  {
    return this.currentGameState.players.length
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // save id for persistence between hibernations
    const id = await this.getPlayers()
    
    this.currentGameState.players.push({
      name: url.searchParams.get("name")?.substring(0,20) ?? "No Name Nelly", 
      kitId: -1, 
      points: 0,
      itemIdUses: [],
    })
    this.sessions.set(server, id)
    server.serializeAttachment(id)

    // Calling `acceptWebSocket()` connects the WebSocket to the Durable Object, allowing the WebSocket to send and receive messages.
    // Unlike `ws.accept()`, `state.acceptWebSocket(ws)` allows the Durable Object to be hibernated
    // When the Durable Object receives a message during Hibernation, it will run the `constructor` to be re-initialized
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    const id = this.sessions.get(ws)!
    const newState : Partial<GameState> | null = await ALL_PHASES[this.currentGameState.phase].processRequest(ws, message, this.currentGameState, id)
    
    if(newState)
    {
      this.updateGameState(true, newState)
    }
  }

  updateGameState(updateClients : boolean, newState : Partial<GameState>)
  {


    Object.assign(this.currentGameState, newState)
    
    try{
      
      this.ctx.storage.kv.put("gamestate", this.currentGameState)
    }catch (e)
    {
      console.log(e)
    }
    
    
    if(updateClients)
    {
      for( const ws of this.ctx.getWebSockets())
      {      
        ws.send(
          JSON.stringify({gameState: {...newState }, playerIndex: this.sessions.get(ws)}),
        );
      }
    }
    
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {

    // If a client closes their connection, kick the other player and die
    this.ctx.storage.deleteAll()
    for( const ws of this.ctx.getWebSockets())
    {      
      ws.close(code, "Durable Object is closing WebSocket");
    }
    
  }

}

export class MatchMaker extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    const format : string = url.searchParams.get("format") ?? "standard";

    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    
    //i guess if there are loooots of players it would be better to keep the queue sorted by format
    const found = this.ctx.getWebSockets(format)

   

    if(found)
    {
      const uniqueId = this.env.MY_DURABLE_OBJECT.newUniqueId().name!
      found[0].send(JSON.stringify({command: "Matched", lobby: uniqueId}))
      server.serializeAttachment({ lobbyId: uniqueId })
    }

    
    // Calling `acceptWebSocket()` connects the WebSocket to the Durable Object, allowing the WebSocket to send and receive messages.
    // Unlike `ws.accept()`, `state.acceptWebSocket(ws)` allows the Durable Object to be hibernated
    // When the Durable Object receives a message during Hibernation, it will run the `constructor` to be re-initialized
    this.ctx.acceptWebSocket(server);

    console.log(format)

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    const messageObj = JSON.parse(message as string)
    
    if(messageObj.command = "Waiting")
    {
      const attachment = ws.deserializeAttachment()
      console.log(attachment)

      if(attachment.lobbyId)
      {
        ws.send(JSON.stringify({command: "Match", lobby: attachment.lobbyId}))
      }
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) 
  {
    ws.close(code, "Durable Object is closing WebSocket"); 
  }

}

//worker that handles initial requests
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      const mode = url.searchParams.get("mode") ?? "search"
      if(mode === "lobby")
      {
        const lobby = url.searchParams.get("lobby") ?? "default";
        const stub = env.MY_DURABLE_OBJECT.getByName(env.MY_DURABLE_OBJECT.idFromName(lobby).name!);
        
        if((await stub.getPlayers()) >= 2)
        {
          return new Response(JSON.stringify({error: "Server is full"}), {
            status: 403,
            headers: {
              'Content-Type' : 'application/json'
            }
          })
        }
        
        return stub.fetch(request);
      }else
      {
        const stub = env.MATCHMAKER.getByName("MatchMaker");

        
        return stub.fetch(request)
        
        
      }
      
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;