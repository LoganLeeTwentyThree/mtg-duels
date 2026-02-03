import { useTimer } from 'react-timer-hook'

export default function Timer( props: { expiryTimeStamp : Date, onExpire : () => void} )
{
    const { seconds } = useTimer({
        expiryTimestamp: props.expiryTimeStamp,
        onExpire: props.onExpire,
    })

    return (
        <div
            className="
                flex
                items-center
                justify-center
                h-20
                w-40
                bg-black/80
                border
                border-pink-400/60
                shadow-[0_0_25px_rgba(236,72,153,0.6)]
                font-mono
            "
        >
            <div className="w-full text-center text-5xl text-gray-100 tracking-widest">
                {seconds}
            </div>
        </div>
    )
}
