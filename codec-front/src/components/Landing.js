import { useEffect, useRef, useState } from "react"
import { Room } from "./Room";
import '../styles/Landing.css'

export const Landing = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [localVideoTrack, setlocalVideoTrack] = useState(null);
    const videoRef = useRef(null);

    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        // MediaStream
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
        setLocalAudioTrack(audioTrack);
        setlocalVideoTrack(videoTrack);
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])

        let playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
            })
            .catch(error => {
            });
          }
        // MediaStream
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef]);

    if (!joined) {
            
    return <div>
        <div className="nav">
            <h1>CODEC</h1>
        </div>
        <div className="container">
                <video autoPlay ref={videoRef} />
                <div className="form">
                    <input type="text" placeholder="name" onChange={(e) => { setName(e.target.value) }} />
                    <button onClick={() => { setJoined(true) }}>Join</button>
                </div>
        </div>
    </div>
    }

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
}