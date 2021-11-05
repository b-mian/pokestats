import React from 'react';

const Pokedex = ({pkmn_list}) => {
    function create_pokedex(pokemon) {
        let master_list = [];
        let pokemon_div = [];
        for (const property in pokemon) {
            let pkmn = [];
            if (Object.hasOwnProperty.call(pokemon, property)) {
                const element = pokemon[property];
                for (const key in element) {
                    if (Object.hasOwnProperty.call(element, key)) {
                        const value = element[key];
                        pkmn.push(
                            <span>{value}</span>
                        );
                    }
                }
            }
            master_list.push(pkmn);
        }
       
        for (let j = 0; j < master_list[0].length; j++) {
            if (j >= 721) {
                return pokemon_div;
            }
            pokemon_div.push(
                <ul className="pokedex-list">
                    <li><img alt={master_list[0][j]} className="pokedex-images" src={`/images/icons/${j+1}.png`}></img></li>
                    <li className="pokemon-name">{master_list[0][j]}{" #"}{master_list[1][j]}</li>
                    <li><span className="type1">{master_list[2][j]}</span>{" "}<span className="type2">{master_list[3][j]}</span></li>
                    <li>{"HP: "}{master_list[4][j]}</li>
                    <li>{"Attack: "}{master_list[5][j]}</li>
                    <li>{"Speed: "}{master_list[6][j]}</li>
                    <li>{"Defense: "}{master_list[7][j]}</li>
                </ul>
            );
        }
    }
    
    return ( 
        <div className="pokedex151-element">
            {create_pokedex(pkmn_list).map((value, index) => {
                    return <span className="pkmn-div" key={index}>{value}</span>
            })} 
        </div>
    )
}

export default Pokedex;