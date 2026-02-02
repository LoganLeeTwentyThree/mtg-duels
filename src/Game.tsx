import useWebSocket, { ReadyState }  from 'react-use-websocket';
import Timer from "./Timer";
import * as Scry from "scryfall-sdk";
import { useRef, useState } from "react";
import { motion } from "motion/react"
import CardView from './CardView';
import Search from "./Search";
import Matchsettings from "./MatchSettings"
import { GameState, ClientCommand  } from "../Protocol"
import { ALL_KITS } from "../Kits"
import { ALL_ITEMS } from '../Items';


export default function Game(props: {lobbyCode : string, name: string}) {

  const { sendMessage, lastMessage, readyState } = useWebSocket(`/api?mode=lobby&lobby=${props.lobbyCode}&name=${props.name}`);

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
  if(gameState.phase == 1)
  {
    
    let expiryTimestamp = null
    
    if(gameState.endsAt)
    {
      const timeRemaining = new Date(gameState.endsAt).getTime() - new Date(gameState.startsAt).getTime()
      expiryTimestamp = new Date( new Date().getTime() + timeRemaining )
    }


    const isMyTurn = gameState.activePlayer === refPlayerIndex.current
    const myBG = isMyTurn ? "bg-green-100" : "bg-gray-100"
    const theirBG = isMyTurn ? "bg-gray-100" : "bg-green-100"

    const myKit = ALL_KITS[gameState.players[refPlayerIndex.current].kitId] ?? 0
    const theirKit = ALL_KITS[gameState.players[refPlayerIndex.current ^ 1].kitId] ?? 0

    return (
      <div className="w-full min-h-dvh flex flex-col items-center bg-gray-700">
        <div className="w-1/1 h-20 bg-black text-white text-center">mtg-duels - Lobby: {props.lobbyCode} - Format: {gameState.format}</div>
        <div className="w-5xl h-full flex flex-col items-center bg-black p-5">
          <div className="flex flex-col size-full text-center p-10 h-full min-w-5xl max-w-7xl">
            
            {gameState?.toast && <div className="bg-white">{gameState?.toast}</div>}
            
            {/* PLAYER CONTAINER*/}
            <div className="flex flex-row justify-between w-full">

              {/* THIS PLAYER */}
              <div className='grid grid-rows-2'>
                <div>
                  {gameState.players[refPlayerIndex.current].itemIdUses.map((e) => 
                    <div 
                      key={`${e[0]}-${e[1]}`} 
                      className={(e[1] > 0 ? 'bg-white hover:bg-yellow-300 hover:scale-105' : "bg-gray-500") + " w-20 h-15 mr-2 flex flex-col justify-center"}
                      onClick={() => sendMessage(JSON.stringify({command: ClientCommand.use, id: e[0]}))}>
                        <div>{`${ALL_ITEMS[e[0]].name} x ${e[1]}`}</div>
                      </div>
                  )}
                </div>
                <div className={`justify-self-start ${myBG} h-20 w-80 flex flex-col items-center justify-center`}>
                  <div>{props.name}</div>
                  <div>{myKit.name}</div>
                  <div>{gameState.players[refPlayerIndex.current]?.points} / {myKit.points}</div>
                </div>

              </div>
              
              {/* TIMER */}
              {expiryTimestamp != null && gameState.winner! == -1 && <Timer key={expiryTimestamp.getTime()} expiryTimeStamp={expiryTimestamp!} onExpire={() => 
                {
                  sendMessage(JSON.stringify({command: ClientCommand.end}))
                }}/>
              }

            {/* OTHER PLAYER */}
            <div className='grid grid-rows-2'>
              <div>
                {gameState.players[refPlayerIndex.current ^ 1].itemIdUses.map((e) => 
                  <div key={`${e[0]}-${e[1]}`}  className={(e[1] > 0 ? 'bg-white' : 'bg-gray-500') + " flex flex-col justify-center w-20 h-15 mr-2"}>
                    <div>{`${ALL_ITEMS[e[0]].name} x ${e[1]}`}</div>
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
            
          {/* SEARCHBAR */}
          <Search onClick={(e) => {
            sendMessage(JSON.stringify({command: ClientCommand.guess, card: e}))
          }}/>

          {/* CARD VIEW */}
          <CardView cards={gameState.guessedCards}/>
            
          </div>    
        </div>
      </div>
    );
  }

  if(gameState.phase == 2)
  {
    return (
      <div className="w-full min-h-dvh flex flex-col items-center bg-black">
        <div className="flex flex-col m-auto items-center bg-gray-500 size-80 m-5 p-5 border-2 border-pink-300 rounded-xl shadow-md shadow-pink-500/100">
          {gameState.winner! == refPlayerIndex.current && <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">You won :D</div>}
          {gameState.winner! != refPlayerIndex.current && <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">You lost :(</div>}
          {gameState.rematch.map((e, i) => { 
            if(e && i != refPlayerIndex.current) 
            {
              return <div>{gameState.players[i].name} wants a rematch!</div>
            }})
          }
          
          <button onClick={() => {
              sendMessage(JSON.stringify({command: ClientCommand.rematch}))
            }} 
            className="bg-white w-1/3 p-2 m-2 text-black hover:scale-105 hover:bg-gray-300">Rematch?</button>
          <button onClick={() => window.location.reload()} className="bg-white w-1/3 p-2 m-2 text-black hover:scale-105 hover:bg-gray-300">Exit</button>
        </div>
        <CardView cards={gameState.guessedCards}/>
      </div>
    )
  }
  
}
