import { DurableObject } from "cloudflare:workers";
import * as Scry from "scryfall-sdk";

type GameState = {
  guessedCards: Array<Scry.Card>,
  activePlayer: 0 | 1, 
  playerNames: Array<string>,
  lastGuessTimeStamp: Date | null,
}

export class MyDurableObject extends DurableObject<Env> {

  currentGameState : GameState = {
      guessedCards: new Array(0),
      activePlayer: 0,
      playerNames: [],
      lastGuessTimeStamp: null
  }
  
  sessions : Map<WebSocket, number> = new Map()
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const oldState : GameState | null | undefined = this.ctx.storage.kv.get("gamestate")

    //if there is existing state and one or more existing websocket connections
    if(oldState != null && oldState != undefined && this.ctx.getWebSockets().length > 0)
    {
      this.currentGameState = oldState
      
      for( const ws of this.ctx.getWebSockets())
      {
        this.sessions.set(ws, ws.deserializeAttachment())
      }
    }
  }


  async fetch(request: Request): Promise<Response> {
    if( this.currentGameState.playerNames.length >= 2)
    {
      return new Response(null, {
        status: 409
      })
    }

    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    
    // save id for persistence between hibernations
    const id = this.currentGameState.playerNames.length
    const url = new URL(request.url)
    this.currentGameState.playerNames.push(url.searchParams.get("name") ?? "No Name Nelly")
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

  isLegalPlay(guess : Scry.Card) : boolean 
  {
    if(guess.type_line.includes("land"))
    {
      return false
    }

    const guessedCards = this.currentGameState.guessedCards

    if(guessedCards.length == 0)
    {
      return true
    }

    const previousGuess = guessedCards[guessedCards.length - 1]

    if(guessedCards.includes(guess))
    {
      return false
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

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {

    Scry.setAgent("Collossal2Dreadmaw", "1.0.0")
    let messageObj = JSON.parse(message as string)
    console.log(this.currentGameState)
    if( messageObj.command === "guess" && this.sessions.get(ws) == this.currentGameState.activePlayer)
    {
      const guessedCard : Scry.Card = await Scry.Cards.byName(messageObj.card)

      if(this.isLegalPlay(guessedCard))
      {
        this.currentGameState.guessedCards.push(guessedCard)
        this.currentGameState.lastGuessTimeStamp = new Date()
        this.currentGameState.activePlayer == 0 ? this.currentGameState.activePlayer = 1 : this.currentGameState.activePlayer = 0
        this.updateClients()
      }
      
    }else if (messageObj.command === "poll")
    {
      this.updateClients()
    } 
  }

  updateClients()
  {
    this.ctx.storage.kv.put("gamestate", this.currentGameState)
    for( const ws of this.ctx.getWebSockets())
    {      
      ws.send(
        JSON.stringify({...this.currentGameState, playerIndex: this.sessions.get(ws)}),
      );
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {
    // If the client closes the connection, the runtime will invoke the webSocketClose() handler.
    this.ctx.storage.kv.delete("gamestate")
    ws.close(code, "Durable Object is closing WebSocket");
  }

}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

   
    if (request.headers.get("Upgrade") === "websocket") {
      const lobby = url.searchParams.get("lobby") ?? "default";
      const stub = env.MY_DURABLE_OBJECT.getByName(lobby);
      return stub.fetch(request);
    }

    // Everything else → React SPA
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;