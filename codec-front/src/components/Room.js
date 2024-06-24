import { useSearchParams } from "react-router-dom"
import { useEffect } from "react"
import {Socket, io} from "socket.io-client"

const URL = "http://localhost:3000"
export const Room = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const name = searchParams.get("name")
    const [socket, setSocket] = useState<null | Socket>(null)

    useEffect(() => {
        const socket = io(URL)
        socket.on('send-offer', ({roomId}) => {
            alert("send offer please")
            socket.emit("offer", {
                sdp: "",
                roomId
            })
        })
        socket.on("offer", ({roomId, offer}) => {
            alert("send answer please")
            socket.emit("answer", {
                sdp: "",
                roomId
            })
        })
        socket.on("answer", ({roomId, answer}) => {
            alert("connection done")
        })
        setSocket(socket)
    }, [name])
    return (
        <div>
            Hi {name}
        </div>
    )
}