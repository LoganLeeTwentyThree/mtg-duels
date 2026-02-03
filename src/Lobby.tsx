import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import Queue from "./Queue"

export default function Lobby( props : {callback : (result : Array<string>) => void})
{
    const codeRef = useRef<HTMLInputElement | null>(null)
    const nameRef = useRef<HTMLInputElement | null>(null)

    const [showTutorial, setShowTutorial] = useState(false)
    const [defaultName, setDefaultName] = useState("")
    const [search, setSearch] = useState(false)
    const [format, setFormat] = useState("standard")

    useEffect(() => {
        async function cookie() {
            cookieStore.get("name").then((e) => setDefaultName(e?.value ?? ""))
        }
        cookie()
    }, [])

    const body = 
    <div className="w-full">
        <div className="w-full text-lg sm:text-xl font-mono tracking-widest text-pink-400 bg-black/70 p-3 mb-4 border border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.35)]">
            JOIN LOBBY
        </div>
        <form
            className="flex flex-col gap-3"
            onSubmit={() => 
            {
                cookieStore.set("name", nameRef.current?.value ?? "")
                if(codeRef.current?.value && nameRef.current?.value)
                {
                    props.callback([codeRef.current?.value!, nameRef.current?.value!])
                }
            }}
        >
            <input
                placeholder="Code"
                ref={codeRef}
                type="text"
                className="bg-black/80 text-pink-300 font-mono tracking-wider p-2 border border-pink-300/40 focus:outline-none focus:border-pink-400"
            />
            <input
                type="submit"
                value="CONNECT"
                className="bg-pink-500/10 text-pink-400 font-mono tracking-widest p-2 border border-pink-400/60 hover:bg-pink-500/20 transition"
            />
        </form>
    </div>

    const tutorial = 
    <div className="w-full">
        <div className="text-lg sm:text-xl font-mono tracking-widest text-pink-400 bg-black/70 p-3 mb-4 border border-pink-400/60">
            HOW TO PLAY
        </div>
        <div className="p-4 bg-black/70 text-pink-200 font-mono text-sm sm:text-base leading-relaxed border border-pink-300/30">
            Take turns naming magic cards that relate to each other by having the same mana value (cmc), power, toughness, or set. Kits allow you to play for an alternate win condition such as naming 10 creatures. If you reach your win condition, or your opponent fails to name a card, you win!
        </div>
    </div>

    return (
    <div className="relative flex flex-col bg-gradient-to-br from-black via-gray-900 to-black min-h-screen w-screen overflow-x-hidden px-4">
        <div className="flex flex-col items-center w-full flex-1 lg:justify-center">
            {/* grid overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="relative text-pink-400 text-3xl sm:text-5xl font-mono tracking-[0.2em] mt-6 mb-4 drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
                MTGDUELS
            </div>

            <input
                placeholder="Your Name"
                defaultValue={defaultName}
                ref={nameRef}
                type="text"
                className="w-full max-w-sm bg-black/80 text-pink-300 font-mono p-2 mb-4 border border-pink-300/40 focus:outline-none"
            />

            <motion.div
                layout
                initial={{opacity: 0, y: 60}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.25}}
                className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl justify-center"
            >
                <motion.div
                    className="relative w-full max-w-sm bg-black/70 p-5 border border-pink-400/60 rounded-xl shadow-[0_0_25px_rgba(236,72,153,0.45)] backdrop-blur"
                >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(236,72,153,0.12)_100%)] bg-[size:100%_4px]" />
                    {showTutorial ? tutorial : body}
                </motion.div>

                {!showTutorial && (
                    <motion.div
                        className="relative w-full max-w-sm bg-black/70 p-5 border border-pink-400/60 rounded-xl shadow-[0_0_25px_rgba(236,72,153,0.45)] backdrop-blur"
                    >
                        <div className="w-full text-lg sm:text-xl font-mono tracking-widest text-pink-400 bg-black/70 p-3 mb-4 border border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.35)]">
                            SEARCH GAME
                        </div>

                        {search && (
                            <Queue
                                format={format}
                                onMatchFound={(lobby) =>
                                    props.callback([lobby, nameRef.current?.value!, format])
                                }
                            />
                        )}

                        {!search && (
                            <select
                                className="w-full bg-black/80 text-pink-300 font-mono p-2 border border-pink-300/40"
                                onChange={(e) => setFormat(e.target.value)}
                            >
                                <option value="standard">Standard</option>
                                <option value="modern">Modern</option>
                                <option value="commander">Commander</option>
                                <option value="vintage">Vintage</option>
                            </select>
                        )}

                        <button
                            className="w-full mt-4 p-2 bg-pink-500/10 text-pink-400 font-mono tracking-widest border border-pink-400/60 hover:bg-pink-500/20 transition"
                            onClick={() => setSearch(true)}
                        >
                            SEARCH
                        </button>
                    </motion.div>
                )}
            </motion.div>

            <button
                onClick={() => setShowTutorial(!showTutorial)}
                className="w-full max-w-sm mt-6 mb-8 p-2 bg-black/80 text-pink-400 font-mono tracking-widest border border-pink-400/50 hover:bg-pink-500/20 transition"
            >
                {showTutorial ? "BACK" : "HOW TO PLAY"}
            </button>
        </div>
    </div>
    )
}
