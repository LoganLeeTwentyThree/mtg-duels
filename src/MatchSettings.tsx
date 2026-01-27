import { useRef } from "react"
import * as Scry from "scryfall-sdk";

export default function MatchSettings( props : {onClick : (e : string) => void})
{
    const formatRef = useRef<HTMLSelectElement>(null)
    return (
        <div className="w-full min-h-screen flex flex-col items-center align-middle bg-black">
            <div className="flex flex-col m-auto items-center bg-gray-500 size-80 m-5 p-5 border-2 border-pink-300 rounded-xl shadow-md shadow-pink-500/100">
                <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">Select a format!</div>
                <div className="flex flex-col m-auto items-center">
                    <select ref={formatRef} className="w-50 m-5 bg-white">
                        {Object.keys(Scry.Format).map((e, i) => {
                            
                            //filter out format ids
                            const test = +e
                            if(!isNaN(test))
                            {
                                return
                            }
                            
                            return (
                            <option key={i} value={e}>{e}</option>
                            )
                        }
                        
                        )}
                    </select>
                    <button onClick={() => props.onClick(formatRef!.current!.value)}className="bg-white w-50">Submit</button>
                </div>
            </div>
        </div>
    )
}