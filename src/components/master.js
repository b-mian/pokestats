import React from 'react';
import fastest from '../data/top_10_speed.json';
import strongest from '../data/top_10_attack.json';
import hp from '../data/top_10_hp.json';
import defense from '../data/top_10_defense.json';
import non_legendary from '../data/top_10_non_legendary.json';
import legendary from '../data/top_10_legendary.json';
import pokedex from '../data/pokedex.json';
import TopTenList from './top_ten_list.js';
import TypesChart from './types_charts.js';
import Pokedex from './pokedex.js';
import { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import GenCharts from './gen_charts';
import Search from './search';
import ScrollButton from './scrollbutton';
import Paginate from './paginate';

const Master = () => {
    const [showLists, setShowLists] = useState(false);
    const [showTypeCharts, setShowTypeCharts] = useState(false);
    const fadeLists = useSpring(
        {display: showLists ? 'inline-block' : 'none'},
    );
    const fadeCharts = useSpring( 
        {display: showTypeCharts ? 'inline-block' : 'none'}
    );
    let listEvent = (e) => {
        e.preventDefault();
        setShowLists(!showLists);
        setShowTypeCharts(showTypeCharts ? !showTypeCharts : showTypeCharts);
    }
    let chartEvent = (e) => {
        e.preventDefault();
        setShowTypeCharts(!showTypeCharts);
        setShowLists(showLists ? !showLists : showLists);
    }
    
    return (
        <div className="main-div">
            <div className="container-fluid buttons-container">
                <div className="buttons-div row justify-content-center">
                    <button onClick={listEvent} className="top10btn col-sm-4 col-md-3">Top 10 Pokemon</button>
                    <button onClick={chartEvent} className="chartbtn col-sm-4 col-md-3 offset-md-2 offset-sm-2">Pokemon Charts</button>
                </div>
            </div>
            
            <animated.div style={fadeLists} className="lists container-fluid">
                <div className="listRow row">
                    <div className="list">
                        <TopTenList pkmnList={hp} title="by HP" />
                    </div>
                    <div className="list">
                        <TopTenList pkmnList={fastest} title="by Speed" />
                    </div>
                    <div className="list">
                        <TopTenList pkmnList={strongest} title="by Attack" />
                    </div>
                    <div className="list">
                        <TopTenList pkmnList={defense} title="by Defense" />
                    </div>
                    <div className="list">
                        <TopTenList pkmnList={legendary} title="Legendary" />
                    </div>
                    <div className="list">
                        <TopTenList pkmnList={non_legendary} title="Non-Legendary" />
                    </div>
                </div>
            </animated.div>
            <animated.div style={fadeCharts} className="graphs container container-fluid">
                <TypesChart /> 
                <GenCharts />
            </animated.div>
            
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

export default Master;



