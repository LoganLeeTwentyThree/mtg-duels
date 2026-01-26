
 import { useTimer } from 'react-timer-hook'
 
 export default function Timer( props: { expiryTimeStamp : Date, onExpire : () => void} )
 {
    const {
        seconds,
        } = useTimer({ expiryTimestamp: props.expiryTimeStamp, onExpire: props.onExpire});

    return (
        <div className="flex items-center h-20 w-50 text-5xl bg-white"><div className='w-full text-center'>{seconds}</div></div>
    )
 }