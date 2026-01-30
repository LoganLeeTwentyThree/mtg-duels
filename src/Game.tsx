import useWebSocket, { ReadyState }  from 'react-use-websocket';
import Timer from "./Timer";
import * as Scry from "scryfall-sdk";
import { useRef, useState } from "react";
import { motion } from "motion/react"
import Search from "./Search";
import Matchsettings from "./MatchSettings"
import { GameState, ClientCommand  } from "../Protocol"
import { ALL_KITS } from "../Kits"
import { ALL_ITEMS } from '../Items';


export default function Game(props: {lobbyCode : string, name: string}) {

  const { sendMessage, lastMessage, readyState } = useWebSocket(`/api?lobby=${props.lobbyCode}&name=${props.name}`);

  const refGameState = useRef<GameState>( new GameState() )
  const refPlayerIndex = useRef<number>(-1)

  //opponent leaves after establishing a connection
  if(readyState === ReadyState.CLOSED && refPlayerIndex.current > -1)
  {
    return (
      <div className="flex flex-col items-center h-screen w-screen bg-black justify-center">
        <div className="bg-gray-500 border-2 border-gray-700 text-5xl h-5xl w-2/3 p-5">Opponent Disconnected</div>
        <button className='bg-white p-2 m-2' onClick={() => window.location.reload()}>Leave</button>
      </div>
    )
  }

  //Connection never established
  if(readyState === ReadyState.CLOSED)
  {
    return (
      <div className="flex flex-col items-center h-screen w-screen bg-black justify-center">
        <div className="bg-gray-500 border-2 border-gray-700 text-5xl h-5xl w-2/3 p-5">Lobby is full!</div>
        <button className='bg-white p-2 m-2' onClick={() => window.location.reload()}>Leave</button>
      </div>
    )
  }
  
  if (readyState === ReadyState.CONNECTING)
  {
    return (
      <div className="flex flex-col items-center h-screen w-screen bg-black justify-center">
        <div className="bg-gray-500 border-2 border-gray-700 text-5xl h-5xl w-2/3 p-5">Connecting...</div>
      </div>
    )
  }

  //first render - no message has been sent 
  if(!lastMessage)
  {
    sendMessage(JSON.stringify({command: ClientCommand.poll}))
    return (
      <div className="flex flex-col items-center h-screen w-screen bg-black justify-center">
        <div className="bg-gray-500 border-2 border-gray-700 text-5xl h-5xl w-2/3 p-5">Connecting...</div>
      </div>
    )
  }

  const data = JSON.parse(lastMessage?.data)
  console.log(data)

  const updatedState : Partial<GameState> = data.gameState
  Object.assign(refGameState.current, updatedState) 
  refPlayerIndex.current = data.playerIndex; 

  if(data.gameState.phase == 0)
  {
    return (<Matchsettings selectFormat={data.playerIndex == 0} onClick={(format, kit, items) => sendMessage(JSON.stringify({command: ClientCommand.settings, format: format, kitId: kit.id, itemIds: items.map((e) => e.id)}))}/>)
  }

  const gameState = refGameState.current
  let timeRemaining = null
  
  if(gameState.lastGuessTimeStamp)
  {
    timeRemaining = new Date(gameState.lastGuessTimeStamp)
    timeRemaining.setSeconds(timeRemaining.getSeconds() + 20)
  }


  const isMyTurn = gameState.activePlayer === refPlayerIndex.current
  const myBG = isMyTurn ? "bg-green-100" : "bg-gray-100"
  const theirBG = isMyTurn ? "bg-gray-100" : "bg-green-100"

  const myKit = ALL_KITS[gameState.players[refPlayerIndex.current].kitId] ?? 0
  const theirKit = ALL_KITS[gameState.players[refPlayerIndex.current ^ 1].kitId] ?? 0

  return (
    <div className="w-full min-h-dvh flex flex-col items-center bg-gray-700">
      <div className="w-1/1 h-20 bg-black text-white text-center">mtg-duels - Lobby: {props.lobbyCode}</div>
      <div className="w-5xl h-full flex flex-col items-center bg-black p-5">
        {gameState.winner! > -1 && <motion.div initial={{scale: 0}} animate={{scale:1}} transition={{duration:0.5}} className="absolute flex flex-col items-center h-1/2 w-1/2 bg-gray-500 border-2 border-gray-700 top-1/4 right-1/4 z-50">
          {gameState.winner! == refPlayerIndex.current && <div className="bg-gray-700 text-center p-5 z-99 m-2">You won :D</div>}
          {gameState.winner! != refPlayerIndex.current && <div className="bg-gray-700 text-center p-5 z-99 m-2">You lost :(</div>}
          <button onClick={() => {
              sendMessage(JSON.stringify({command: ClientCommand.rematch}))
            }} 
            className="bg-white w-1/3 p-2 m-2 text-black hover:scale-105 hover:bg-gray-300">Rematch?</button>
          <button onClick={() => window.location.reload()} className="bg-white w-1/3 p-2 m-2 text-black hover:scale-105 hover:bg-gray-300">Exit</button>
        </motion.div>}
        <div className="flex flex-col size-full text-center p-10 h-full min-w-5xl max-w-7xl">
          
          {gameState?.toast && <div className="bg-white">{gameState?.toast}</div>}
          
          {/* PLAYER CONTAINER*/}
          <div className="flex flex-row justify-between w-full">

            {/* THIS PLAYER */}
            <div className='grid grid-rows-2'>
              <div>
                {gameState.players[refPlayerIndex.current].itemIdUses.map((e) => 
                  <div 
                    key={e[0]} 
                    className='bg-white w-20 h-15 mr-2 hover:bg-yellow-300 hover:scale-105'
                    onClick={() => sendMessage(JSON.stringify({command: ClientCommand.use, id: e[0]}))}>
                      <div>{ALL_ITEMS[e[0]].name}</div>
                      <div>Uses: {e[1]}</div>
                    </div>
                )}
              </div>
              <div className={`justify-self-start ${myBG} h-20 w-80 flex flex-col items-center justify-center`}>
                <div>{props.name}</div>
                <div>{myKit.name}</div>
                <div>{gameState.players[refPlayerIndex.current]?.points} / {myKit.points ?? 10}</div>
              </div>

            </div>
            
            {/* TIMER */}
            {timeRemaining != null && gameState.winner! == -1 && <Timer key={timeRemaining.getTime()} expiryTimeStamp={timeRemaining!} onExpire={() => 
              {
                sendMessage(JSON.stringify({command: ClientCommand.end}))
              }}/>
              }

          {/* OTHER PLAYER */}
          <div className='grid grid-rows-2'>
            <div>
              {gameState.players[refPlayerIndex.current ^ 1].itemIdUses.map((e) => 
                <div key={e[0]} className='bg-white w-20 h-15 mr-2 hover:bg-yellow-300 hover:scale-105'>
                  <div>{ALL_ITEMS[e[0]].name}</div>
                  <div>Uses: {e[1]}</div>
                </div>
              )}
            </div>
            <div className={`justify-self-end ${theirBG} h-20 w-80 flex flex-col items-center justify-center`}>
              <div>{gameState?.players[refPlayerIndex.current ^ 1]?.name}</div>
              <div>{theirKit.name}</div>
              <div>{gameState?.players[refPlayerIndex.current ^ 1]?.points} / {theirKit.points}</div>
            </div>
          </div>

        </div>
          
          <Search onClick={(e) => {
            sendMessage(JSON.stringify({command: ClientCommand.guess, card: e}))
          }}/>

          {/* CARD VIEW */}
          <div className="p-5 h-full w-full overflow-y-scroll [scrollbar-width:none]">
            {gameState && gameState.guessedCards.length > 0 && [...gameState.guessedCards].reverse().map((e : Scry.Card, i : number) => 
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
