
 import { useTimer } from 'react-timer-hook'
 
 export default function Timer( props: { expiryTimeStamp : Date, onExpire : () => void} )
 {
    const {
        seconds,
        } = useTimer({ expiryTimestamp: props.expiryTimeStamp, onExpire: props.onExpire});

    return (
        <div className="flex items-center bg-white h-20 w-50 text-5xl"><div className='text-center'>{seconds}</div></div>
    )
 }