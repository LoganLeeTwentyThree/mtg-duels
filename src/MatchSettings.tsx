import { useState } from "react"
import * as Scry from "scryfall-sdk";
import { ALL_KITS, CREATURES, Kit }  from "../Kits" 
import { ALL_ITEMS, Item, ESCAPE } from "../Items"

type MatchSettingsProps = {
  onClick: (format: string, kit: Kit, items: Array<Item>) => void
  selectFormat: boolean
}

export default function MatchSettings({ onClick, selectFormat }: MatchSettingsProps) {
  const [format, setFormat] = useState<string>("standard")
  const [submitted, setSubmitted] = useState<boolean>(false)

  const [kit, setKit] = useState<Kit>(CREATURES)
  const [items, setItems] = useState<Array<Item>>([ESCAPE])

  const formats = Object.keys(Scry.Format).filter(
    key => Number.isNaN(Number(key)) // get rid of format ids
  )


  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="flex gap-5">
            {!submitted && selectFormat && (
                <div className="flex flex-col m-auto items-center bg-gray-500 size-80 m-5 p-5 border-2 border-pink-300 rounded-xl shadow-md shadow-pink-500/100">
                    <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">
                        Select a format!
                    </div>

                     <select
                        value={format}
                        onChange={e => setFormat(e.target.value)}
                        className="w-50 m-5 bg-white"
                        >
                        {formats.map(e => (
                        <option key={e} value={e}>
                            {e}
                        </option>
                        ))}
                    </select>
                </div>
             )}

        {!submitted && 
        <div className="flex flex-col m-auto items-center bg-gray-500 size-80 m-5 p-5 border-2 border-pink-300 rounded-xl shadow-md shadow-pink-500/100">
            <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">
                Build your kit!
            </div>
            <div className="bg-white p-1 m-1">Win Condition</div>
            <select
                className="w-50 m-2 bg-white"
                onChange={(e) => setKit(ALL_KITS[Number(e.target.value)])}
                >
                {ALL_KITS.map(e => (
                    <option key={e.id} value={e.id}>
                        {e.name}
                    </option>
                    ))}
            </select>
            <div className="bg-white p-1 m-1">Items</div>
            <select
                className="w-50 m-2 bg-white"
                onChange={(e) => setItems([ALL_ITEMS[Number(e.target.value)]])}
                >
                {ALL_ITEMS.map(e => (
                    <option key={e.name} value={e.id}>
                        {e.name}
                    </option>
                    ))}
            </select>
        </div>}

    </div>

    {!submitted && 
        <button
            onClick={() => {
                onClick(format, kit, items)
                setSubmitted(true)
            }}
            className="bg-white w-50 m-5 hover:bg-gray-300 hover:scale-105"
            >
                Submit
        </button>
    }

    {submitted && 
    <div className="flex flex-col m-auto items-center bg-gray-500 size-80 m-5 p-5 border-2 border-pink-300 rounded-xl shadow-md shadow-pink-500/100">
        <div className="w-full text-xl bg-white p-2 mb-5 inset-shadow-sm inset-shadow-pink-300">Waiting for opponent...</div>
    </div>
    }
    </div>
  )
}
