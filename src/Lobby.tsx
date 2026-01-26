import { useEffect, useRef, useState } from "react"


export default function Lobby( props : {callback : (result : Array<string>) => void})
{
    const codeRef = useRef<HTMLInputElement | null>(null)
    const nameRef = useRef<HTMLInputElement | null>(null)

    const [showTutorial, setShowTutorial] = useState(false)

    const [defaultName, setDefaultName] = useState("")
    useEffect(() => {
        async function cookie() {
            cookieStore.get("name").then((e) => setDefaultName(e?.value ?? ""))
        }

        cookie()
    }, [])


    const body = 
    <div>
        <div className="w-full text-xl border-2 border-gray-700 bg-gray-600 p-2 mb-5">Join a lobby</div>
        <form className="flex flex-col" onSubmit={() => 
            {
                cookieStore.set("name", nameRef.current?.value ?? "")
                if(codeRef.current?.value && codeRef.current?.value != "" && nameRef.current?.value && nameRef.current?.value != "")
                {
                    props.callback([codeRef.current?.value!, nameRef.current?.value!])
                }
            }}>
            <input placeholder="Code" ref={codeRef} type="text" className="bg-white p-1 m-1 w-50"></input>
            <input placeholder="Name" defaultValue={defaultName} ref={nameRef} type="text" className="bg-white p-1 m-1 w-50"></input>
            <input type="submit" className="bg-white p-1 m-1 hover:bg-gray-300 hover:scale-105"></input>
            <button onClick={() => setShowTutorial(true)} className="self-end w-50 m-1 p-1 bg-white text-black hover:bg-gray-300 hover:scale-105">How do I Play?</button>
        </form>
    </div>

    const tutorial = 
    <div>
        <div className="w-full text-xl border-2 border-gray-700 bg-gray-600 p-2 mb-5">How to Play</div>
        <div className="m-5">Take turns naming magic cards that relate to each other by having the same mana value (cmc), power, toughness, or set. The first one to fail to name a card in 20 seconds loses!</div>
        <button onClick={() => setShowTutorial(false)} className="self-end m-auto p-1 bg-white text-black hover:bg-gray-300 hover:scale-105">Back</button>
    </div>




    

    return (
    <div className="flex flex-col justify-center items-center bg-black h-screen w-screen">
        <div className="text-white text-5xl">MTGDuels</div>
        <div className="flex flex-col items-center bg-gray-500 size-80 m-5 p-5 border-2 border-gray-700 rounded-xl">
            {showTutorial && tutorial}
            {!showTutorial && body}
        </div>
    </div>
    )
}