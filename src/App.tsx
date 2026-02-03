import { useState } from "react";
import Game from "./Game";
import Lobby from "./Lobby";



export default function App() {
  const [lobbyCodeAndName, setLobbyCodeAndName] = useState<Array<string>>([])

  return (
    <div>
      {lobbyCodeAndName.length == 0 && (
        <div className="flex-1"> 
          <Lobby callback={setLobbyCodeAndName} />
        </div>
        
      )}

      {lobbyCodeAndName.length == 2 && (
        <Game lobbyCode={lobbyCodeAndName[0]} name={lobbyCodeAndName[1]} />
      )}

      {lobbyCodeAndName.length == 3 && (
        <Game lobbyCode={lobbyCodeAndName[0]} name={lobbyCodeAndName[1]} format={lobbyCodeAndName[2]}/>
      )}
    </div>
  );

  
}
