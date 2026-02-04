import { useState } from "react";
import Game from "./Game";
import Lobby from "./Lobby";
import { LobbyInfo } from "../Protocol";


export default function App() {
  const [lobbyInfo, setLobbyInfo] = useState<LobbyInfo>()

  return (
    <div>
      {!lobbyInfo && (
        <div className="flex-1"> 
          <Lobby callback={setLobbyInfo} />
        </div>
        
      )}

      {lobbyInfo && (
        <Game lobbyCode={lobbyInfo.code} name={lobbyInfo.name} format={lobbyInfo.format} kitId={lobbyInfo.kitId} items={lobbyInfo.itemIds}/>
      )}
    </div>
  );

  
}
