import "./App.css";
import useWebSocket, { ReadyState }  from 'react-use-websocket';
import Timer from "./Timer";
import * as Scry from "scryfall-sdk";
import { useState } from "react";

type GameState = {
  guessedCards: Array<Scry.Card>,
  playerIndex: number,
  activePlayer: number, 
  lastGuessTimeStamp: Date | null,
  playerNames: Array<string>,
  toast?: string
}

export default function Game(props: {lobbyCode : string, name: string}) {

  const { sendMessage, lastMessage, readyState } = useWebSocket(`/api?lobby=${props.lobbyCode}&name=${props.name}`);
  const [winningPlayer, setWinningPlayer] = useState<number>(-1)

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  if(connectionStatus === 'Closed')
  {
    window.location.reload()
  }
  
  if (connectionStatus === 'Connecting')
  {
    return (
      <div className="flex flex-col items-center h-screen w-screen bg-black justify-center">
        <div className="bg-gray-500 border-2 border-gray-700 text-5xl h-5xl w-5xl p-5">Connecting...</div>
      </div>
    )
  }

  let gameState : GameState | null = null
  let timeRemaining = null
  if(lastMessage != null)
  {
    gameState = JSON.parse(lastMessage?.data)
    console.log(gameState)
    if(gameState!.lastGuessTimeStamp != null)
    {
        timeRemaining = new Date(gameState!.lastGuessTimeStamp)
        timeRemaining.setSeconds(timeRemaining.getSeconds() + 20)
    }
    
  }else 
  {
    sendMessage(JSON.stringify({command: "poll"}))
  }
  
  let myBG
  let theirBG
  if(gameState?.activePlayer == gameState?.playerIndex)
  {
    myBG = "bg-green-100"
    theirBG = "bg-gray-100" 
  }else
  {
    myBG = "bg-gray-100"
    theirBG = "bg-green-100" 
  }

  let otherName = gameState?.playerIndex! ^ 1


  return (
    <div className="static flex flex-col items-center flex-1 bg-gray-500">
      <div className="w-full h-20 bg-black text-white text-center">mtg-duels - Lobby: {props.lobbyCode}</div>
      {winningPlayer > -1 && <div className="absolute flex flex-col items-center h-1/2 w-1/2 bg-gray-500 border-2 border-gray-700 top-1/4 right-1/4">
        {winningPlayer == gameState?.playerIndex && <div>You won :D</div>}
        {winningPlayer != gameState?.playerIndex && <div>You lost :(</div>}
      </div>}
      <div className="flex flex-col size-full text-center p-10 h-full min-w-5xl max-w-7xl">
        {gameState?.toast && <div className="bg-white">{gameState?.toast}</div>}
        <div id="playerContainer" className="flex flex-row justify-between w-full">
          <div className={`justify-self-start ${myBG} h-20 w-100 flex flex items-center justify-center`}><div>{props.name}</div></div>
          {timeRemaining != null && <Timer key={timeRemaining!.getSeconds()} expiryTimeStamp={timeRemaining!} onExpire={() => 
            {
                setWinningPlayer(gameState!.activePlayer ^ 1)
            }}/>
            }
          <div className={`justify-self-end ${theirBG} h-20 w-100 flex flex items-center justify-center`}>{gameState?.playerNames[otherName]}</div>
        </div>
        <div id="chainContainer" className="mt-10 h-100 w-full overflow-y-scroll [scrollbar-width:none]">
          {gameState != null && gameState.guessedCards.reverse().map((e : Scry.Card, i : number) => 
            (
              <div className="flex flex-col items-center justify-center h-fit" key={i}>
                <div className="w-5 bg-pink-100 h-10"></div>
                <div className="flex justify-center items-center bg-white rounded-xl w-60 h-fit text-center p-5"><img src={e.image_uris?.small}></img></div>
              </div>
            ))}
        </div>
        <input type="text" className="bg-white p-5 rounded-xl" onKeyDown={(e) => {
          if (e.key == "Enter" ) {
            sendMessage(JSON.stringify({command:"guess", card: e.currentTarget.value})
          )}
          }}></input>
      </div>    
    </div>
  );
}
