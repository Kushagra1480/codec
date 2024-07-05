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
    const localVideoRef = useRef()

    useEffect(() => {
        const socket = io(URL)
        socket.on('send-offer', async ({roomId}) => {
            console.log("send-offer")
            setLobby(false)
            const pc = new RTCPeerConnection()
            setSendingPc(pc)
            if (localAudioTrack) {
                pc.addTrack(localAudioTrack)
            }
            if (localVideoTrack) {
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
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer()
            pc.setLocalDescription(sdp)
            const stream = new MediaStream()
            if(remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream
            }
            setRemoteMediaStream(stream)
            setReceivingPc(pc)
            window.pcr = pc
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
            pc.ontrack = (e) => {
            }
            socket.emit("answer", {
                roomId, 
                sdp: sdp
            })
            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                if(track1.kind === "video") {
                    setRemoteVideoTrack(track1)
                    setRemoteAudioTrack(track2)
                } else {
                    setRemoteVideoTrack(track2)
                    setRemoteAudioTrack(track1)
                }
                remoteVideoRef.current.srcObject.addTrack(track1)
                remoteVideoRef.current.srcObject.addTrack(track2)
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
            }, 5000)
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
            if (type === "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("receiving pc not found")
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