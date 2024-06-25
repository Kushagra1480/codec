import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import {Socket, io} from "socket.io-client"

const URL = "http://localhost:3000"
export const Room = ({
    name, 
    localVideoTrack,
    localAudioTrack,
}) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [lobby, setLobby] = useState(true)
    const [socket, setSocket] = useState(null)
    const [sendingPc, setSendingPc] = useState(null)
    const [receivingPc, setReceivingPc] = useState(null)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState(null)
    const [remoteAudioTrack, setRemoteAudioTrack] = useState(null)
    const [remoteMediaStream, setRemoteMediaStream] = useState(null)
    const remoteVideoRef = useRef()

    useEffect(() => {
        const socket = io(URL)
        socket.on('send-offer', async ({roomId}) => {
            setLobby(false)
            const pc = new RTCPeerConnection()
            setSendingPc(pc)
            pc.addTrack(localVideoTrack)
            pc.addTrack(localAudioTrack)
            pc.onicecandidate = () => {
                const sdp = pc.createOffer()
                socket.emit("offer", {
                    sdp: "",
                    roomId
                })
            }
        })
        socket.on("offer", async ({roomId, offer}) => {
            setLobby(false)
            const pc = new RTCPeerConnection()
            pc.setRemoteDescription({sdp: offer, type: "offer"})
            const sdp = await pc.createAnswer()
            const stream = new MediaStream()
            if(remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream
            }
            setRemoteMediaStream(stream)
            setReceivingPc(pc)
            pc.ontrack = ({track, type}) => {
                if (type === "audio") {
                    setRemoteAudioTrack(track)
                    remoteVideoRef.current.srcObject = new MediaStream([track])
                } else {
                    setRemoteVideoTrack(track)
                    remoteVideoRef.current.srcObject = new MediaStream([track])
                }
                remoteVideoRef.current.play()
            }
            socket.emit("answer", {
                roomId, 
                sdp: sdp
            })
        })
        socket.on("answer", ({roomId, answer}) => {
            setLobby(false)
            setSendingPc(pc => {
                pc?.setRemoteDescription({type: "answer", sdp: answer})
                return pc
            })
        })
        socket.on("lobby", () => {
            setLobby(true)
        })
        setSocket(socket)
    }, [name])
    if(lobby) {
        return <div>
            Waiting to connect you to someone...
        </div>
    }
    return (
        <div>
            Hi {name}
            <video autoPlay width={400} height={400} />
            <video autoPlay width={400} height={400} ref={remoteVideoRef}/>
        </div>
    )
}