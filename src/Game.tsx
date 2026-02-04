import useWebSocket, { ReadyState } from 'react-use-websocket'
import Timer from "./Timer"
import { useRef, useEffect } from "react"
import CardView from './CardView'
import Search from "./Search"
import { GameState, ClientCommand } from "../Protocol"
import { ALL_KITS } from "../Kits"
import { ALL_ITEMS } from '../Items'

export default function Game(props: { lobbyCode: string, name: string, format: string, kitId: number, items: Array<number> }) {

  const { sendMessage, lastMessage, readyState } = useWebSocket(`/api?mode=lobby&lobby=${props.lobbyCode}&name=${props.name}`)

  const refGameState = useRef<GameState>(new GameState())
  const refPlayerIndex = useRef<number>(-1)

  /* =======================
     CONNECTION STATES
  ======================= */

  if (readyState === ReadyState.CLOSED && refPlayerIndex.current > -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-pink-400 font-mono">
        <div className="bg-black/70 border border-pink-400/60 p-6 text-3xl shadow-[0_0_25px_rgba(236,72,153,0.6)]">
          OPPONENT DISCONNECTED
        </div>
        <button
          className="mt-6 px-6 py-2 border border-pink-400/60 hover:bg-pink-500/20 transition"
          onClick={() => window.location.reload()}
        >
          LEAVE
        </button>
      </div>
    )
  }

  if (readyState === ReadyState.CLOSED) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-pink-400 font-mono">
        <div className="bg-black/70 border border-pink-400/60 p-6 text-3xl shadow-[0_0_25px_rgba(236,72,153,0.6)]">
          LOBBY FULL
        </div>
        <button
          className="mt-6 px-6 py-2 border border-pink-400/60 hover:bg-pink-500/20 transition"
          onClick={() => window.location.reload()}
        >
          LEAVE
        </button>
      </div>
    )
  }

  if (!lastMessage) {
    sendMessage(JSON.stringify({ command: ClientCommand.poll }))
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-pink-400 font-mono">
        <div className="bg-black/70 border border-pink-400/60 p-6 text-3xl shadow-[0_0_25px_rgba(236,72,153,0.6)] animate-pulse">
          CONNECTING…
        </div>
      </div>
    )
  }

  /* =======================
     GAME STATE
  ======================= */

  const data = JSON.parse(lastMessage.data)
  Object.assign(refGameState.current, data.gameState)
  refPlayerIndex.current = data.playerIndex
  const gameState = refGameState.current
  console.log(gameState)

  if (gameState.phase == 0) {
    if(gameState.players[refPlayerIndex.current].kitId != props.kitId)
    {
      
      sendMessage(JSON.stringify({
        command: ClientCommand.settings,
        format: props.format,
        kitId: props.kitId,
        itemIds: props.items
      }))
    }
    

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-pink-400 font-mono">
        <div className="bg-black/70 border border-pink-400/60 p-6 text-3xl shadow-[0_0_25px_rgba(236,72,153,0.6)] animate-pulse">
          WAITING FOR OPPONENT...
        </div>
      </div>
         
    )
  }



  /* =======================
     ACTIVE GAME
  ======================= */

  if (gameState.phase == 1) {

    let expiryTimestamp = null

    if (gameState.endsAt) {
      expiryTimestamp = new Date(Date.now() + (new Date(gameState.endsAt).getTime() - new Date(gameState.startsAt).getTime()))
    }

    const isMyTurn = gameState.activePlayer === refPlayerIndex.current
    const myKit = ALL_KITS[gameState.players[refPlayerIndex.current].kitId]
    const theirKit = ALL_KITS[gameState.players[refPlayerIndex.current ^ 1].kitId]

    return (
      <div className="min-h-dvh w-full bg-gradient-to-br from-black via-gray-900 to-black text-pink-200 font-mono">

        {/* HEADER */}
        <div className="text-center p-3 border-b border-pink-400/40 tracking-widest">
          MTG-DUELS · LOBBY {props.lobbyCode} · {gameState.format.toUpperCase()}
        </div>

        {/* grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="flex flex-col items-center max-w-7xl mx-auto p-4 gap-4">

          {gameState.toast && (
            <div className="bg-black/70 border border-pink-400/40 p-2 text-center">
              {gameState.toast}
            </div>
          )}

          {/* PLAYER PANELS */}
          <div className="flex w-full justify-between items-start gap-4">

            {/* ME */}
            <div className="grid grid-rows-2 gap-2">
              <div className="flex gap-2">
                {gameState.players[refPlayerIndex.current].itemIdUses.map(e => (
                  <div
                    key={`${e[0]}-${e[1]}`}
                    className={`w-20 h-14 flex items-center justify-center border
                      ${e[1] > 0
                        ? "border-pink-400/60 hover:bg-pink-500/20 hover:scale-105 cursor-pointer"
                        : "border-gray-600 opacity-40"}`}
                    onClick={() =>
                      e[1] > 0 &&
                      sendMessage(JSON.stringify({ command: ClientCommand.use, id: e[0] }))
                    }
                  >
                    {ALL_ITEMS[e[0]].name} × {e[1]}
                  </div>
                ))}
              </div>

              <div className={`p-3 border ${isMyTurn ? "border-green-400" : "border-gray-500"} text-center`}>
                <div>{props.name}</div>
                <div>{myKit.name}</div>
                <div>{gameState.players[refPlayerIndex.current].points} / {myKit.points}</div>
              </div>
            </div>

            {/* TIMER */}
            {expiryTimestamp && gameState.winner === -1 && (
              <Timer
                key={expiryTimestamp.getTime()}
                expiryTimeStamp={expiryTimestamp}
                onExpire={() => sendMessage(JSON.stringify({ command: ClientCommand.end }))}
              />
            )}

            {/* OPPONENT */}
            <div className="grid grid-rows-2 gap-2">
              <div className="flex gap-2">
                {gameState.players[refPlayerIndex.current ^ 1].itemIdUses.map(e => (
                  <div
                    key={`${e[0]}-${e[1]}`}
                    className={`w-20 h-14 flex items-center justify-center border
                      ${e[1] > 0 ? "border-pink-400/40" : "border-gray-600 opacity-40"}`}
                  >
                    {ALL_ITEMS[e[0]].name} × {e[1]}
                  </div>
                ))}
              </div>

              <div className={`p-3 border ${!isMyTurn ? "border-green-400" : "border-gray-500"} text-center`}>
                <div>{gameState.players[refPlayerIndex.current ^ 1].name}</div>
                <div>{theirKit.name}</div>
                <div>{gameState.players[refPlayerIndex.current ^ 1].points} / {theirKit.points}</div>
              </div>
            </div>
          </div>

          <Search onClick={e =>
            sendMessage(JSON.stringify({ command: ClientCommand.guess, card: e }))
          } />

          <CardView cards={gameState.guessedCards} />
        </div>
      </div>
    )
  }

  /* =======================
     GAME OVER
  ======================= */

  if (gameState.phase === 2) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-black text-pink-400 font-mono gap-6">
        {/* grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="bg-black/70 border border-pink-400/60 p-6 text-xl text-center">
          {gameState.winner === refPlayerIndex.current ? "YOU WON" : "YOU LOST"}
        </div>

        {gameState.rematch[refPlayerIndex.current ^ 1] && <div className="px-6 py-2 border border-pink-400/60 hover:bg-pink-500/20 transition">{gameState.players[refPlayerIndex.current ^ 1].name + " REQUESTS A REMATCH!"}</div>}
        <div className="flex gap-4">
          <button
            className="px-6 py-2 border border-pink-400/60 hover:bg-pink-500/20 transition"
            onClick={() => sendMessage(JSON.stringify({ command: ClientCommand.rematch }))}
          >
            REMATCH
          </button>
          <button
            className="px-6 py-2 border border-pink-400/60 hover:bg-pink-500/20 transition"
            onClick={() => window.location.reload()}
          >
            EXIT
          </button>
        </div>

        <CardView cards={gameState.guessedCards} />
      </div>
    )
  }
}
