import { useRef, useState } from "react"
import * as Scry from "scryfall-sdk";

export default function Search(props : {onClick : (e : string) => void})
{

    const [searchResults, setSearchResults] = useState<Array<string>>([])
    const searchRef = useRef<HTMLInputElement>(null)


    return (
        <div>
        <input 
                type="text" 
                placeholder="Search for a Magic card..."
                className="static bg-white p-5 mt-5 w-full" 
                ref={searchRef}
                onChange={(e) => {
                    Scry.Cards.autoCompleteName(e.target.value).then((result) => setSearchResults(result))
                }}></input>
                <div className="grid grid-rows-5 divide-y divide-solid divide-gray-300 overflow-y-hidden overflow-x-hidden h-40 z-10">
                {searchResults.slice(0, 5).map((e, index) => <div 
                    key={index} 
                    className="bg-white align-middle p-2 hover:bg-gray-300 hover:scale-105"
                    onClick={() => {
                        searchRef.current!.value = ""
                        setSearchResults([])
                        props.onClick(e)}}>
                    {e}
                    </div>)
                }
            </div>
        </div>
    )
}