import { useSearchParams } from "react-router-dom"
import { useEffect } from "react"

export const Room = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    useEffect(() => {
        
    }, [name])
    const name = searchParams.get("name")
    return (
        <div>
            Hi {name}
        </div>
    )
}