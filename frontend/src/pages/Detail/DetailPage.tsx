import { useParams } from "react-router-dom";

const Detail = () => {
    const { type, id } = useParams();

    return (
        <div>
            <h1>Discovery Detail</h1>
            <p>Type: {type}</p>
            <p>ID: {id}</p>
        </div>
    )
}

export default Detail;