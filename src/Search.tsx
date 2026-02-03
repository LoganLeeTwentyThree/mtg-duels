import { useRef, useState } from "react"
import * as Scry from "scryfall-sdk"

export default function Search(props : {onClick : (e : string) => void})
{
    const [searchResults, setSearchResults] = useState<Array<string>>([])
    const searchRef = useRef<HTMLInputElement>(null)

    return (
        <div className="relative w-full max-w-2xl mt-4 font-mono">
            <input 
                type="text" 
                placeholder="SEARCH MAGIC CARD…"
                className="
                    w-full
                    bg-black/80
                    text-gray-100
                    placeholder-gray-400
                    p-4
                    border
                    border-pink-400/60
                    tracking-wider
                    focus:outline-none
                    focus:border-pink-400
                    focus:shadow-[0_0_15px_rgba(236,72,153,0.6)]
                "
                ref={searchRef}
                onChange={(e) => {
                    Scry.Cards.autoCompleteName(e.target.value)
                        .then((result) => setSearchResults(result))
                }}
            />

            {searchResults.length > 0 && (
                <div
                    className="
                        absolute
                        left-0
                        right-0
                        mt-1
                        z-20
                        bg-black/90
                        border
                        border-pink-400/50
                        shadow-[0_0_20px_rgba(236,72,153,0.4)]
                        backdrop-blur
                    "
                >
                    {searchResults.slice(0, 5).map((e, index) => (
                        <div 
                            key={index}
                            className="
                                px-4
                                py-2
                                text-gray-100
                                border-b
                                border-pink-400/20
                                hover:bg-pink-500/20
                                hover:text-white
                                cursor-pointer
                                transition
                            "
                            onClick={() => {
                                searchRef.current!.value = ""
                                setSearchResults([])
                                props.onClick(e)
                            }}
                        >
                            {e}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
