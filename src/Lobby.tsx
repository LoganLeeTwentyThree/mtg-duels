import { useRef } from "react"


export default function Lobby( props : {callback : (result : Array<string>) => void})
{
    const codeRef = useRef<HTMLInputElement | null>(null)
    const nameRef = useRef<HTMLInputElement | null>(null)

    return (
    <div className="flex flex-col justify-center items-center bg-black size-full">
        <div className="flex flex-col items-center bg-gray-500 size-80 p-5 border-2 border-gray-700 rounded-xl">
            <div className="w-full text-xl border-2 border-gray-700 bg-gray-600 p-2 mb-5">Join a lobby</div>
            <form className="" onSubmit={() => props.callback([codeRef.current?.value!, nameRef.current?.value!])}>
                <input placeholder="Code" ref={codeRef} type="text" className="bg-white p-1 w-50"></input>
                <input placeholder="Name" ref={nameRef} type="text" className="bg-white p-1 w-50"></input>
                <input type="submit" className="bg-white p-1 m-1"></input>
            </form>
        </div>
    </div>
    )
}