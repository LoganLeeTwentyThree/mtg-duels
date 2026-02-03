import useWebSocket, { ReadyState } from "react-use-websocket";
import { useEffect } from "react";

interface QueueProps {
    format: string,
    onMatchFound: (lobby: string) => void
}

export default function Queue({onMatchFound, format} : QueueProps)
{
    const { sendMessage, lastMessage, readyState } = useWebSocket(`/api?mode=search&format=${format}`);

    useEffect(() => {
        if(lastMessage)
        {
            const message = JSON.parse(lastMessage.data)
            if(message.command === "Match")
            {
                onMatchFound(message.lobby)
            }
        }
    }, [lastMessage])

    if(readyState === ReadyState.CLOSED)
    {
        return (
        <div>
            <div className="bg-gray-500 border-2 border-gray-700 text-xl h-1/2 w-2/3 p-5">Queue Failed</div>
            <button className='bg-white p-2 m-2' onClick={() => window.location.reload()}>Try Again</button>
        </div>
        )
    }

    if(readyState === ReadyState.CONNECTING)
    {
        return (
            <div className="bg-gray-500 border-2 border-gray-700 text-xl h-1/2 w-2/3 p-5">Searching for a match...</div>
        )
        
    }

    if(!lastMessage)
    {
        sendMessage(JSON.stringify({command : "Waiting"}))
    }

    return (
        <div className="bg-gray-500 border-2 border-gray-700 text-xl h-1/2 w-2/3 p-5">Searching for a match...</div>
    )
    
}