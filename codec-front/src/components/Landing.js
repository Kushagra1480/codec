import { Link } from "react-router-dom"
import { useState } from "react"


export const Landing = () => {
    const [name, setName] = useState("")
    return (
        <div>
            <input type="text"
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name">
            </input>
            <Link to={`/room?name=${name}`}>Join</Link>
        </div>
    )
}