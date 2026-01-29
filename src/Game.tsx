import useWebSocket, { ReadyState }  from 'react-use-websocket';
import Timer from "./Timer";
import * as Scry from "scryfall-sdk";
import { useRef, useState } from "react";
import { motion } from "motion/react"
import Search from "./Search";
import Matchsettings from "./MatchSettings"
import { GameState, NAME_TO_KIT, Player } from "./../types"


export default function Game(props: {lobbyCode : string, name: string}) {

  const { sendMessage, lastMessage, readyState } = useWebSocket(`/api?lobby=${props.lobbyCode}&name=${props.name}`);

  let refGameState = useRef<GameState>( new GameState() )
  let refPlayerIndex = useRef<number>(-1)

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

  
  let timeRemaining = null
  if(lastMessage != null)
  {
    const data = JSON.parse(lastMessage?.data)
    console.log(data)
    if(data.command === "update")
    {
      const updatedState : Partial<GameState> = JSON.parse(lastMessage?.data).gameState
      Object.assign(refGameState.current, updatedState) 
    }else if (data.command === "push")
    {
      //this doesnt work yet
      refGameState.current.guessedCards.push(data.card)
    }else if (data.command === "settings")
    {
      refPlayerIndex.current = data.playerIndex;
      return (<Matchsettings selectFormat={data.playerIndex == 0} onClick={(format, kit) => sendMessage(JSON.stringify({command: "settings", format: format, kit: kit}))}/>)
    }
    
  }else 
  {
    sendMessage(JSON.stringify({command: "poll"}))
  }
  
  const gameState : GameState | null = refGameState.current
  
  if(gameState?.lastGuessTimeStamp != null)
  {
    timeRemaining = new Date(gameState!.lastGuessTimeStamp)
    timeRemaining.setSeconds(timeRemaining.getSeconds() + 20)
  }

  let myBG
  let theirBG
  if(gameState?.activePlayer == refPlayerIndex.current)
  {
    myBG = "bg-green-100"
    theirBG = "bg-gray-100" 
  }else
  {
    myBG = "bg-gray-100"
    theirBG = "bg-green-100" 
  }


  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gray-700">
      <div className="w-1/1 h-20 bg-black text-white text-center">mtg-duels - Lobby: {props.lobbyCode}</div>
      <div className="w-5xl h-full flex flex-col items-center bg-black p-5">
        {gameState.winner! > -1 && <motion.div initial={{scale: 0}} animate={{scale:1}} transition={{duration:0.5}} className="absolute flex flex-col items-center h-1/2 w-1/2 bg-gray-500 border-2 border-gray-700 top-1/4 right-1/4 z-50">
          {gameState.winner! == refPlayerIndex.current && <div className="bg-gray-700 text-center p-5 z-99 m-2">You won :D</div>}
          {gameState.winner! != refPlayerIndex.current && <div className="bg-gray-700 text-center p-5 z-99 m-2">You lost :(</div>}
          <button onClick={() => {
              sendMessage(JSON.stringify({command:"rematch"}))
            }} 
            className="bg-white w-1/3 p-2 m-2 text-black hover:scale-105 hover:bg-gray-300">Rematch?</button>
          <button onClick={() => window.location.reload()} className="bg-white w-1/3 p-2 m-2 text-black hover:scale-105 hover:bg-gray-300">Exit</button>
        </motion.div>}
        <div className="flex flex-col size-full text-center p-10 h-full min-w-5xl max-w-7xl">
          {gameState?.toast && <div className="bg-white">{gameState?.toast}</div>}
          <div id="playerContainer" className="flex flex-row justify-between w-full">
            <div className={`justify-self-start ${myBG} h-20 w-80 flex flex-col items-center justify-center`}>
              <div>{props.name}</div>
              <div>{gameState.players[refPlayerIndex.current]?.kit}</div>
              <div>{gameState.players[refPlayerIndex.current]?.points} / {NAME_TO_KIT.get(gameState.players[refPlayerIndex.current]?.kit)?.points ?? 10}</div>
            </div>
            {timeRemaining != null && <Timer key={timeRemaining!.getSeconds()} expiryTimeStamp={timeRemaining!} onExpire={() => 
              {
                sendMessage(JSON.stringify({command: "over"}))
              }}/>
              }
            <div className={`justify-self-end ${theirBG} h-20 w-80 flex flex-col items-center justify-center`}>
              <div>{gameState?.players[refPlayerIndex.current ^ 1]?.name}</div>
              <div>{gameState.players[refPlayerIndex.current ^ 1]?.kit}</div>
              <div>{gameState.players[refPlayerIndex.current ^ 1]?.points} / {NAME_TO_KIT.get(gameState.players[refPlayerIndex.current ^ 1]?.kit)?.points ?? 10}</div>
            </div>
          </div>
          
          <Search onClick={(e) => {
            sendMessage(JSON.stringify({command:"guess", card: e}))
          }}/>

          <div id="chainContainer" className="p-5 h-full w-full overflow-y-scroll [scrollbar-width:none]">
            {gameState != null && [...gameState.guessedCards].reverse().map((e : Scry.Card, i : number) => 
              (
                <div className="flex flex-col items-center justify-center h-fit" key={e.name}>
                  {i != 0 && <motion.div
                    key={`${e.name}-connector`}
                    className="flex flex-col items-center justify-center w-5 bg-pink-200 overflow-x-visible shadow-md shadow-pink-500/100"
                    initial={ {height: i == 1 ? 0 : 120} }
                    animate={{ height: i == 1 ? 120 : 120 }}
                    transition={{ duration: 1 }}
                  >
                    {e.cmc === gameState.guessedCards[gameState.guessedCards.length - i]?.cmc && <div className="w-30 bg-white text-black border-4 border-pink-300 mb-2 shadow-md shadow-pink-500/100">Cmc - {e.cmc}</div>}
                    {e.set_id === gameState.guessedCards[gameState.guessedCards.length - i]?.set_id && <div className="w-30 bg-white text-black border-4 border-pink-300 mb-2 shadow-md shadow-pink-500/100">Set - {e.set}</div>}
                    {e.power && e.power === gameState.guessedCards[gameState.guessedCards.length - i]?.power && <div className="w-30 bg-white text-black border-4 border-pink-300 mb-2 shadow-md shadow-pink-500/100">Power - {e.power}</div>}
                    {e.toughness && e.toughness === gameState.guessedCards[gameState.guessedCards.length - i]?.toughness && <div className="w-30 bg-white text-black border-4 border-pink-300 mb-2 shadow-md shadow-pink-500/100">Tougness - {e.toughness}</div>}

                  </motion.div>}
                  <motion.div
                    key={`${e.name}-card`} 
                    className={"flex justify-center items-center bg-white rounded-xl w-60 text-center overflow-y-hidden" + (i == 0 ? " border-4 border-pink-300 shadow-md shadow-pink-500/100" : "")}
                    initial={ {opacity: i == 0 ? 0 : 100, height: i == 0 ? 0 : "250px"} }
                    animate={{ opacity: 100, height: "250px" }}
                    transition={{ duration: 1 }}
                    >
                      <img src={e.image_uris?.small || e.card_faces[0].image_uris?.small}></img>
                    </motion.div>
                </div>
              ))}
          </div>
          
        </div>    
      </div>
    </div>
  );
}
