import { DurableObject } from "cloudflare:workers";
import * as Scry from "scryfall-sdk";
import { GameState, ClientCommand, ServerCommand, CREATURES, ALL_KITS, ALL_ITEMS } from "./../types"
import type {Kit, Item} from "./../types"

export class MyDurableObject extends DurableObject<Env> {
  currentGameState : GameState =  new GameState()
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
    }
  }

  

  async addRandomCard()
  {
    const random = await Scry.Cards.random(`format:${this.currentGameState.format} -type:land`)
    if(random != undefined)
    {
      this.updateGameState(true,{
        guessedCards: [...this.currentGameState.guessedCards, random],
      })
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

  isLegalPlay(guess : Scry.Card) : boolean 
  {
    //need to address pathways
    if(guess.type_line.includes("Land") && !guess.card_faces)
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

    switch (messageObj.command as ClientCommand) {
      case ClientCommand.guess: this.handleGuess(ws, messageObj); break;
      case ClientCommand.poll: this.handlePoll(ws); break;
      case ClientCommand.rematch: this.handleRematch(ws); break;
      case ClientCommand.end: this.handleOver(); break;
      case ClientCommand.settings: this.handleSettings(ws, messageObj); break;
      case ClientCommand.use: this.handleUse(ws, messageObj); break;
    }
  }

  async handleUse(ws : WebSocket, messageObj : any)
  {
    const id = this.sessions.get(ws)
    
    if(id != this.currentGameState.activePlayer)
    {
      return
    }
    
    const itemId = messageObj.id
    if (this.currentGameState.players[id].itemIdUses[itemId][1] <= 0)
    {
      
      return;
    }

    this.currentGameState.players[id].itemIdUses[itemId][1] -= 1
    const newGameState = await ALL_ITEMS[itemId].use(this.currentGameState)
    this.updateGameState(true, newGameState)
  }

  handlePoll(ws : WebSocket)
  {
    ws.send(JSON.stringify({command: ServerCommand.settings, playerIndex: this.sessions.get(ws)}))
  }

  handleSettings(ws : WebSocket, messageObj : any)
  {
    const id = this.sessions.get(ws)!
    if(id == 0)//only the host can choose the format
    {
      this.updateGameState(false, {
        format: messageObj.format
      })
    }

    this.currentGameState.players[id].itemIdUses = messageObj.itemIds.map((e : number) => [e, 1])
    this.currentGameState.players[id].kitId = messageObj.kitId
    this.updateGameState(false, {}) //serialize kit

    if(this.currentGameState.players[id ^ 1].kitId > -1)
    {
      this.addRandomCard() //random card must be added after the format is chosen
      this.initializeClientState()
    }
  }

  handleOver()
  {
    //sometimes this doesnt work ?
    if(this.currentGameState.lastGuessTimeStamp && new Date().getSeconds() - this.currentGameState.lastGuessTimeStamp?.getSeconds() >= 20 && this.currentGameState.winner == -1)
    {
      this.updateGameState(true, {winner: (this.currentGameState.activePlayer ^ 1) as -1 | 0 | 1})
    }
  }

  async handleRematch(ws : WebSocket)
  {
    this.currentGameState.rematch[this.sessions.get(ws)!] = true
      if (this.currentGameState.rematch[0] && this.currentGameState.rematch[1])
      {
        const newGame: GameState = {
          ...this.currentGameState,
          lastGuessTimeStamp: null,
          winner: -1,
          guessedCards: [],
          rematch: [false, false],
          activePlayer: (this.currentGameState.activePlayer ^ 1) as 0 | 1,
          players: this.currentGameState.players.map(p => ({
            ...p,
            points: 0,
          })),
          pushCard: this.currentGameState.pushCard
        }

        this.updateGameState(false, newGame)
        await this.addRandomCard()
        this.initializeClientState()
      }
  }
  

  async handleGuess(ws : WebSocket, messageObj: any)
  {
    try{
        
        const result = Scry.Cards.search(`game:paper !"${messageObj.card}" format:${this.currentGameState.format}`).all()
        const guessedCard : Scry.Card | void = ((await result.next()).value)
        
        
        if(guessedCard == null || guessedCard == undefined)
        {
          this.updateGameState(true,{toast: "Invalid card"})
          return
        }

        const id = this.sessions.get(ws)
        
        if(this.isLegalPlay(guessedCard!))
        {
          const player = this.currentGameState.players[id!]
          const newPoints = player.points + ((ALL_KITS[player.kitId]).isWin(guessedCard) ? 1 : 0)
          const isOver = newPoints >= (ALL_KITS[player.kitId].points) ? true : false
          this.updateGameState(true,
            {
              players: this.currentGameState.players.map((e, i) => {
                if( i == id )
                {
                  return {
                    ...e,
                    points: newPoints,
                  }
                }else {
                  return e
                }
              }), //important that players stay at same index
              guessedCards: [...this.currentGameState.guessedCards, guessedCard],
              lastGuessTimeStamp: new Date(),
              activePlayer: (this.currentGameState.activePlayer ^ 1) as 0 | 1,
              toast: "",
              winner: isOver ? (id ?? -1) as -1 | 0 | 1 : -1
            })
        }else
        {
          this.updateGameState(true, {toast: `Invalid guess: ${guessedCard!.name}`})
        }
      }catch (e)
      {
        console.log(e)
      }
  }



  initializeClientState()
  {
    for( const ws of this.ctx.getWebSockets())
      {      
        ws.send(
          JSON.stringify({command: ServerCommand.update, gameState: {...this.currentGameState}, playerIndex: this.sessions.get(ws)}),
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
          JSON.stringify({command: ServerCommand.update, gameState: {...newState }, playerIndex: this.sessions.get(ws)}),
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


//worker that handles initial requests
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