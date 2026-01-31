import * as Scry from "scryfall-sdk"
import { motion } from "motion/react"

type CardViewProps = {
    cards: Array<Scry.Card>
}

export default function CardView({cards} : CardViewProps)
{
    return (
    <div className="p-5 h-full w-full overflow-y-scroll [scrollbar-width:none]">
    {cards.length > 0 && [...cards].reverse().map((e : Scry.Card, i : number) => 
        (
        <div className="flex flex-col items-center justify-center h-fit" key={e.name}>
            {i != 0 && <motion.div
            key={`${e.name}-connector`}
            className="flex flex-col items-center justify-center w-5 bg-pink-200 overflow-x-visible shadow-md shadow-pink-500/100"
            initial={ {height: i == 1 ? 0 : 120} }
            animate={{ height: i == 1 ? 120 : 120 }}
            transition={{ duration: 1 }}
            >
            {e.cmc === cards[cards.length - i]?.cmc && <div className="w-30 bg-white text-black border-4 border-pink-300 mb-2 shadow-md shadow-pink-500/100">Cmc - {e.cmc}</div>}
            {e.set_id === cards[cards.length - i]?.set_id && <div className="w-30 bg-white text-black border-4 border-pink-300 mb-2 shadow-md shadow-pink-500/100">Set - {e.set}</div>}
            {e.power && e.power === cards[cards.length - i]?.power && <div className="w-30 bg-white text-black border-4 border-pink-300 mb-2 shadow-md shadow-pink-500/100">Power - {e.power}</div>}
            {e.toughness && e.toughness === cards[cards.length - i]?.toughness && <div className="w-30 bg-white text-black border-4 border-pink-300 mb-2 shadow-md shadow-pink-500/100">Tougness - {e.toughness}</div>}

            </motion.div>}
            <motion.div
            key={`${e.name}-card`} 
            className={"flex justify-center items-center bg-white rounded-xl w-60 text-center overflow-y-hidden" + (i == 0 ? " border-4 border-pink-300 shadow-md shadow-pink-500/100" : "")}
            initial={ {opacity: i == 0 ? 0 : 100, height: i == 0 ? 0 : "250px"} }
            animate={{ opacity: 100, height: "250px" }}
            transition={{ duration: 1 }}
            >
                <img src={e.image_uris?.small || e.card_faces[0].image_uris?.small}></img>
            </motion.div>
        </div>
        ))}
    </div>
    )
}