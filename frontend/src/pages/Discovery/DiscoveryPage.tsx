import { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";


const DiscoveryPage = () => {

    const [search, setSearch] = useState("");

    useEffect(() => {
        console.log(search);
    }, [search]);

    return (
        <div>
            <SearchBar value={search} onChange={setSearch} onSearch={() => { }} />

        </div>
    )
}

export default DiscoveryPage;