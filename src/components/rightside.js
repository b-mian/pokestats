import React from 'react';
import pokedex from '../data/pokedex.json';
import Pokedex from './pokedex.js';
import Search from './search';
import ScrollButton from './scrollbutton';
import Paginate from './paginate';

const RightSide = () => {
    return (
        <div className="main-div">
            <div className="search-pokedex container-fluid mt-4">
                <div className="row justify-content-center">
                    <div className="col-lg-4 col-lg-offset-4">
                        <Search />
                    </div>
                </div>
            </div>
           
            <div className="pokedex151-container container-fluid">
                <div className="pokedex151-row row justify-content-center">
                    <Pokedex pkmn_list={pokedex}/>
                </div>
            </div>
            <div className="pagination-container container-fluid">
                <div className="row justify-content-center">
                    <Paginate />
                </div>
            </div>
            <div>
                <ScrollButton />
            </div>
        </div>
    )
}

export default RightSide;