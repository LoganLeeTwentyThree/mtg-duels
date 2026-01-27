import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"

export default function Lobby( props : {callback : (result : Array<string>) => void})
{
    const codeRef = useRef<HTMLInputElement | null>(null)
    const nameRef = useRef<HTMLInputElement | null>(null)

    const [showTutorial, setShowTutorial] = useState(false)
    const [defaultName, setDefaultName] = useState("")
    const kits : Array<string> = ["Standard Legal", "Universes Beyond", "Alpha", "WUBRG Cards"]
    
    useEffect(() => {
        async function cookie() {
            cookieStore.get("name").then((e) => setDefaultName(e?.value ?? ""))
        }

        cookie()
    }, [])


    const body = 
    <div className="m-auto">
        <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">Join a lobby</div>
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
        <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">How to Play</div>
        <div className="m-5">Take turns naming magic cards that relate to each other by having the same mana value (cmc), power, toughness, or set. The first one to fail to name a card in 20 seconds loses!</div>
        <button onClick={() => setShowTutorial(false)} className="self-end m-auto p-1 bg-white text-black hover:bg-gray-300 hover:scale-105">Back</button>
    </div>

    return (
    <div className="flex flex-col justify-center items-center bg-black h-screen w-screen">
        <div className="text-white text-5xl">MTGDuels</div>
        <motion.div initial={{opacity: 0, y: 100}} animate={{opacity: 100, y:0}} transition={{duration: 1, ease: "backOut"}}className="flex flex-row">
            <div className="flex items-center bg-gray-500 size-80 m-5 p-5 border-2 border-pink-300 rounded-xl shadow-md shadow-pink-500/100">
                {showTutorial && tutorial}
                {!showTutorial && body}
            </div>
            <div className="flex items-center bg-gray-500 size-80 m-5 p-5 border-2 border-pink-300 rounded-xl shadow-md shadow-pink-500/100">
                <div className="m-auto flex flex-col">
                    <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">Choose a Kit</div>
                    <div>Coming soon...</div>
                </div>
            </div>
        </motion.div>
        
    </div>
    )
}