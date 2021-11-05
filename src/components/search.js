import React from 'react';
import { useState } from 'react';
import { useSpring } from 'react-spring';

const Search = () => {
    const [search, setSearch] = useState("");
    const [showPokemon, setShowPokemon] = useState(false);
    const isAppearing = useSpring(
        {display: showPokemon ? 'inline-block' : 'none'},
    );
    
    const handleSearch = (event) => {
        setSearch(event.target.value);
    };
    const filterEvent = (e) => {
        let pokemonNames = document.getElementsByClassName('pokemon-name');
        let pokemonType1 = document.getElementsByClassName('type1');
        let pokemonType2 = document.getElementsByClassName('type2');
        let pokemonDivs = document.getElementsByClassName('pkmn-div');
        e.preventDefault();
        if ((search === "")) {
            return;
        }
        for (let i=0;i<pokemonNames.length;i++) {
            if ( pokemonNames[i].innerText.toLowerCase().includes(search.toLowerCase()) || 
                 pokemonType1[i].innerText.toLowerCase().includes(search.toLowerCase()) ||
                 pokemonType2[i].innerText.toLowerCase().includes(search.toLowerCase()) &&
                 ((search != " ") && (search !== null))) 
            {
                setShowPokemon(!showPokemon);
                pokemonDivs[i].style = isAppearing;
            }
            else {
                pokemonDivs[i].style.display = 'none';

            }
        }
    }


    return (
        <div className="col-sm-12">
            <form onSubmit={filterEvent} type="submit">
                <div className="form-group">
                    <input type="search" className="form-control" id="searchPokemonInput" 
                        placeholder="Search Pokedex..." onChange={handleSearch}>
                    </input>
                </div>
            </form>
        </div>
    )
}



export default Search;