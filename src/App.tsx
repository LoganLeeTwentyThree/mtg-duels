import { useState } from "react";
import "./App.css";
import Game from "./Game";
import Lobby from "./Lobby";



export default function App() {
  const [lobbyCodeAndName, setLobbyCodeAndName] = useState<Array<string>>([])

  return (
    <>
      {lobbyCodeAndName.length == 0 && (
        <div className="h-dvh"> 
          <Lobby callback={setLobbyCodeAndName} />
        </div>
        
      )}

      {lobbyCodeAndName.length != 0 && (
        <Game lobbyCode={lobbyCodeAndName[0]} name={lobbyCodeAndName[1]} />
      )}
    </>
  );

  
}
