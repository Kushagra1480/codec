import { useEffect, useState, useRef } from "react"
import { io } from "socket.io-client"

const URL = "http://localhost:3000"
export const Room = ({
    name, 
    localVideoTrack,
    localAudioTrack,
}) => {
    const [lobby, setLobby] = useState(true)
    const [socket, setSocket] = useState(null)
    const [sendingPc, setSendingPc] = useState(null)
    const [receivingPc, setReceivingPc] = useState(null)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState(null)
    const [remoteAudioTrack, setRemoteAudioTrack] = useState(null)
    const [remoteMediaStream, setRemoteMediaStream] = useState(null)
    const remoteVideoRef = useRef()
    const localVideoRef = useRef()

    useEffect(() => {
        const socket = io(URL)
        socket.on('send-offer', async ({roomId}) => {
            console.log("send-offer")
            setLobby(false)
            const pc = new RTCPeerConnection()
            setSendingPc(pc)
            if (localAudioTrack) {
                console.log("added track")
                console.log(localAudioTrack)
                pc.addTrack(localAudioTrack)
            }
            if (localVideoTrack) {
                console.log("added track")
                console.log(localAudioTrack)
                pc.addTrack(localVideoTrack)
            }
            pc.onicecandidate = async (e) => {
                    if (e.candidate) {
                        socket.emit("add-ice-candidate", {
                            candidate: e.candidate,
                            type: "sender",
                            roomId
                    })
                }
            }
            pc.onnegotiationneeded = async () => {
                const sdp = await pc.createOffer()
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        })
        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("offer")
            setLobby(false)
            const pc = new RTCPeerConnection()
            const stream = new MediaStream()
            if(remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream
            }
            setRemoteMediaStream(stream)
            setReceivingPc(pc)
            window.pcr = pc
            pc.ontrack = (e) => {
                const {track, type} = e
                if (type === "audio") {
                    setRemoteAudioTrack(track)
                    remoteVideoRef.current.srcObject.addTrack(track)
                } else {
                    setRemoteVideoTrack(track)
                    remoteVideoRef.current.srcObject.addTrack(track)
                }
                let remotePlayPromise = remoteVideoRef.current.play()
                if (remotePlayPromise !== undefined) {
                    remotePlayPromise.then(_ => {
                      // Automatic playback started!
                      // Show playing UI.
                    })
                    .catch(error => {
                      // Auto-play was prevented
                      // Show paused UI.
                    });
                  }
            }
            pc.onicecandidate = async (e) => {
                    if (!e.candidate) {
                        return
                    }
                    if (e.candidate) {
                        socket.emit("add-ice-candidate", {
                            candidate: e.candidate, 
                            type: "receiver",
                            roomId
                    })
                }   
            }
            await pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer()
            await pc.setLocalDescription(sdp)
            setReceivingPc(pc)
            socket.emit("answer", {
                roomId, 
                sdp: sdp
            })
        })
        socket.on("answer", ({roomId, sdp: remoteSdp}) => {
            console.log("answer")
            setLobby(false)
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc
            })
        })
        socket.on("lobby", () => {
            setLobby(true)
        })
        socket.on("add-ice-candidate", ({candidate, type}) => {
            console.log("add-ice-candidate")
            if (type == "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("receiving pc not found")
                    } else {
                        console.log(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc
                })
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.error("sending pc not found")
                    }
                    pc?.addIceCandidate(candidate)
                    return pc
                })
            }
        })
        setSocket(socket)
    }, [name])
    
    useEffect(() => {
        if (localVideoRef.current) {
            if(localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack])
                let localPlayPromise = localVideoRef.current.play()
                if (localPlayPromise !== undefined) {
                    localPlayPromise.then(_ => {
                      // Automatic playback started!
                      // Show playing UI.
                    })
                    .catch(error => {
                      // Auto-play was prevented
                      // Show paused UI.
                    });
                  }
            }
        }
    }, [localVideoRef])
    return (
        <div>
            Hi {name}
            <video autoPlay width={400} height={400} ref={localVideoRef}/>
            {lobby ? "Waiting to connect you to someone..." : null}
            <video autoPlay width={400} height={400} ref={remoteVideoRef}/>
        </div>
    )
}