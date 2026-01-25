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
    Scry.setAgent("mtg-duels", "1.0.0")
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

  async getPlayers() : Promise<number>
  {
    return this.currentGameState.playerNames.length
  }

  async fetch(request: Request): Promise<Response> {

    const url = new URL(request.url)

    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // save id for persistence between hibernations
    const id = this.currentGameState.playerNames.length
    
    this.currentGameState.playerNames.push(url.searchParams.get("name") ?? "No Name Nelly")
    this.sessions.set(server, id)
    server.serializeAttachment(id)

    if(await this.getPlayers() < 2)
    {
      try{
        const random = await Scry.Cards.random()
        if(random != undefined)
        {
          this.currentGameState.guessedCards.push(random)
        }
      }catch (caught){
        console.log(caught)
      }
      
      
    }
    
    

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

    if(guessedCards.reduce((acc, ele) => (acc || guess.name == ele.name), false))
    {
      return false
    } 

    if(guessedCards.length == 0)
    {
      return true
    }

    const previousGuess = guessedCards[guessedCards.length - 1]

    if(previousGuess.set == guess.set)
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

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    let messageObj = JSON.parse(message as string)
    if( messageObj.command === "guess" && this.sessions.get(ws) == this.currentGameState.activePlayer && (await this.getPlayers()) == 2)
    {
      
      const result = Scry.Cards.search(`game:paper not:reprint name:${messageObj.card}`).all()
      let guessedCard : Scry.Card | void = ((await result.next()).value)

      if(guessedCard == null || guessedCard == undefined)
      {
        this.updateClients("Invalid card")
        return
      }

      if(this.isLegalPlay(guessedCard!))
      {
        this.currentGameState.guessedCards.push(guessedCard!)
        this.currentGameState.lastGuessTimeStamp = new Date()
        this.currentGameState.activePlayer == 0 ? this.currentGameState.activePlayer = 1 : this.currentGameState.activePlayer = 0
        this.updateClients()
      }else
      {
        this.updateClients(`Invalid guess: ${guessedCard!.name}`)
      }
      
    }else if (messageObj.command === "poll")
    {
      this.updateClients()
    } 
  }

  updateClients(toast? : string)
  {
    this.ctx.storage.kv.put("gamestate", this.currentGameState)
    for( const ws of this.ctx.getWebSockets())
    {      
      ws.send(
        JSON.stringify({...this.currentGameState, playerIndex: this.sessions.get(ws), toast: toast}),
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
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;