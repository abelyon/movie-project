import { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";
import MovieGrid from "./components/MediaContainer";
import SortBar from "./components/SortBar";


const DiscoveryPage = () => {

    const [search, setSearch] = useState("");

    useEffect(() => {
        console.log(search);
    }, [search]);

    return (
        <div>
            <SortBar />
            <SearchBar value={search} onChange={setSearch} onSearch={() => { }} />
            <MovieGrid />
        </div>
    )
}

export default DiscoveryPage;