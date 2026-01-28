import { DurableObject } from "cloudflare:workers";
import * as Scry from "scryfall-sdk";
import { NAME_TO_KIT, GameState } from "./../types"
import type { Player } from "./../types";

export class MyDurableObject extends DurableObject<Env> {
  currentGameState : GameState =  new GameState()
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

  async addRandomCard()
  {
    try{
        const random = await Scry.Cards.random(`format:${this.currentGameState.format} -type:land`)
        if(random != undefined)
        {
          this.updateGameState(true,{
            guessedCards: [...this.currentGameState.guessedCards, random],
          })
        }
    }catch (caught){
      console.log(caught)
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
    
    this.currentGameState.players.push({name: url.searchParams.get("name") ?? "No Name Nelly", kit: "None", points: 0})
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
    if(guess.type_line.includes("Land"))
    {
      return false
    }
    
    const guessedCards = this.currentGameState.guessedCards

    if(guessedCards.reduce((acc, ele) => (acc || guess.name == ele.name), false))
    {
      return false
    } 

    const format = this.currentGameState.format as keyof typeof guess.legalities
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

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    let messageObj = JSON.parse(message as string)
    const id = this.sessions.get(ws)

    //if its a guess from the active player, and there are two players, and the time hasnt run out
    if( messageObj.command === "guess" && id == this.currentGameState.activePlayer && (await this.getPlayers()) == 2 && (!this.currentGameState.lastGuessTimeStamp || new Date().getSeconds() - this.currentGameState.lastGuessTimeStamp!.getSeconds() < 20 ))
    {      
      try{
        
        const result = Scry.Cards.search(`game:paper !"${messageObj.card}" format:${this.currentGameState.format}`).all()
        const guessedCard : Scry.Card | void = ((await result.next()).value)
        
        
        if(guessedCard == null || guessedCard == undefined)
        {
          this.updateGameState(true,{toast: "Invalid card"})
          return
        }
        
        if(this.isLegalPlay(guessedCard!))
        {
          this.updateGameState(true,
            {
              players: this.currentGameState.players.map((e, i) => {
                if( i == id)
                {
                  return {
                    name: e.name,
                    kit: e.kit,
                    points: e.points + ((NAME_TO_KIT.get(e.kit) ?? NAME_TO_KIT.get("Creatures")!).isWin(guessedCard) ? 1 : 0)
                  }
                }else {
                  return e
                }
              }), //important that players stay at same index
              guessedCards: [...this.currentGameState.guessedCards, guessedCard],
              lastGuessTimeStamp: new Date(),
              activePlayer: (this.currentGameState.activePlayer ^ 1) as 0 | 1,
              toast: ""
            })
        }else
        {
          this.updateGameState(true, {toast: `Invalid guess: ${guessedCard!.name}`})
        }
      }catch (e)
      {
        console.log(e)
      }
    }else if (messageObj.command === "poll")
    {
      ws.send(JSON.stringify({command: "settings", playerIndex: this.sessions.get(ws)}))
    }else if( messageObj.command === "rematch")
    {
      this.currentGameState.rematch[this.sessions.get(ws)!] = true
      if (this.currentGameState.rematch[0] && this.currentGameState.rematch[1])
      {
        let newGame = new GameState()
        newGame.activePlayer = (this.currentGameState.activePlayer ^ 1) as 0 | 1
        this.updateGameState(false, newGame)
        await this.addRandomCard()
        this.initializeClientState()
        
      }
    }else if (messageObj.command === "over")
    {
      //sometimes this doesnt work ?
      if(this.currentGameState.lastGuessTimeStamp && new Date().getSeconds() - this.currentGameState.lastGuessTimeStamp?.getSeconds() >= 20 && this.currentGameState.winner == -1)
      {
        this.updateGameState(true, {winner: (this.currentGameState.activePlayer ^ 1) as -1 | 0 | 1})
      }
    }else if( messageObj.command === "settings")
    {

      let id = this.sessions.get(ws)!
      if(id == 0)//only the host can choose the format
      {
        this.updateGameState(false, {
          format: messageObj.format
        })
      }

      this.currentGameState.players[id].kit = messageObj.kit
      this.updateGameState(false, {}) //serialize kit

      if(this.currentGameState.players[id ^ 1].kit !== "None")
      {
        this.addRandomCard() //random card must be added after the format is chosen
        this.initializeClientState()
      }
        
    
    }
  }

  initializeClientState()
  {
    for( const ws of this.ctx.getWebSockets())
      {      
        ws.send(
          JSON.stringify({command: "update", gameState: {...this.currentGameState}, playerIndex: this.sessions.get(ws)}),
        );
      }
  }

  updateGameState(updateClients : boolean, newState : Partial<GameState>)
  {

    Object.assign(this.currentGameState, newState)
    this.ctx.storage.kv.put("gamestate", this.currentGameState)
    
    if(updateClients)
    {
      for( const ws of this.ctx.getWebSockets())
      {      
        ws.send(
          JSON.stringify({command: "update", gameState: {...newState }, playerIndex: this.sessions.get(ws)}),
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

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
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
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;