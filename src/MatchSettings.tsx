import { useState } from "react"
import * as Scry from "scryfall-sdk"
import { ALL_KITS, CREATURES, Kit } from "../Kits"
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
    key => Number.isNaN(Number(key))
  )

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black px-4 overflow-x-hidden">
      {/* grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* desktop vertical centering */}
      <div className="flex flex-col items-center w-full flex-1 lg:justify-center">

        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl justify-center">
          {!submitted && selectFormat && (
            <div className="relative flex flex-col items-center bg-black/70 w-full max-w-sm p-5 border border-pink-400/60 rounded-xl shadow-[0_0_30px_rgba(236,72,153,0.45)] backdrop-blur">
              {/* scanlines */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(236,72,153,0.12)_100%)] bg-[size:100%_4px]" />

              <div className="w-full text-lg sm:text-xl font-mono tracking-widest text-pink-400 bg-black/80 p-3 mb-5 border border-pink-400/60 text-center shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                SELECT FORMAT
              </div>

              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full bg-black/80 text-pink-300 font-mono tracking-wider p-2 border border-pink-300/40 focus:outline-none focus:border-pink-400"
              >
                {formats.map(e => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!submitted && (
            <div className="relative flex flex-col items-center bg-black/70 w-full max-w-sm p-5 border border-pink-400/60 rounded-xl shadow-[0_0_30px_rgba(236,72,153,0.45)] backdrop-blur">
              {/* scanlines */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(236,72,153,0.12)_100%)] bg-[size:100%_4px]" />

              <div className="w-full text-lg sm:text-xl font-mono tracking-widest text-pink-400 bg-black/80 p-3 mb-5 border border-pink-400/60 text-center shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                BUILD KIT
              </div>

              <div className="w-full text-sm font-mono tracking-widest text-pink-300 bg-black/70 p-2 mb-1 border border-pink-300/30 text-center">
                WIN CONDITION
              </div>

              <select
                className="w-full bg-black/80 text-pink-300 font-mono tracking-wider p-2 mb-4 border border-pink-300/40 focus:outline-none"
                onChange={(e) => setKit(ALL_KITS[Number(e.target.value)])}
              >
                {ALL_KITS.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>

              <div className="w-full text-sm font-mono tracking-widest text-pink-300 bg-black/70 p-2 mb-1 border border-pink-300/30 text-center">
                ITEMS
              </div>

              <select
                className="w-full bg-black/80 text-pink-300 font-mono tracking-wider p-2 border border-pink-300/40 focus:outline-none"
                onChange={(e) => setItems([ALL_ITEMS[Number(e.target.value)]])}
              >
                {ALL_ITEMS.map(e => (
                  <option key={e.name} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!submitted && (
          <button
            onClick={() => {
              onClick(format, kit, items)
              setSubmitted(true)
            }}
            className="w-full max-w-sm mt-8 p-2 bg-pink-500/10 text-pink-400 font-mono tracking-widest border border-pink-400/60 hover:bg-pink-500/20 hover:shadow-[0_0_25px_rgba(236,72,153,0.7)] hover:scale-[1.03] transition"
          >
            SUBMIT
          </button>
        )}

        {submitted && (
          <div className="relative flex flex-col items-center bg-black/70 w-full max-w-sm mt-8 p-5 border border-pink-400/60 rounded-xl shadow-[0_0_30px_rgba(236,72,153,0.45)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(236,72,153,0.12)_100%)] bg-[size:100%_4px]" />

            <div className="w-full text-lg font-mono tracking-widest text-pink-400 bg-black/80 p-3 border border-pink-400/60 text-center shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              WAITING FOR OPPONENT…
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
