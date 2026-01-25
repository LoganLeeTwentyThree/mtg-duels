import { useState } from "react";
import "./App.css";
import Game from "./Game";
import Lobby from "./Lobby";



export default function App() {
  const [lobbyCodeAndName, setLobbyCodeAndName] = useState<Array<string>>([])

  return (
    <div className="flex flex-col h-screen">
      {lobbyCodeAndName.length == 0 && (
        <div className="flex-1"> 
          <Lobby callback={setLobbyCodeAndName} />
        </div>
        
      )}

      {lobbyCodeAndName.length != 0 && (
        <Game lobbyCode={lobbyCodeAndName[0]} name={lobbyCodeAndName[1]} />
      )}
    </div>
  );

  
}
