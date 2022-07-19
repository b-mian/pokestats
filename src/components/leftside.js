import React from 'react';
import { useSpring, animated } from 'react-spring';
import { useState } from 'react';
import fastest from '../data/top_10_speed.json';
import strongest from '../data/top_10_attack.json';
import hp from '../data/top_10_hp.json';
import defense from '../data/top_10_defense.json';
import non_legendary from '../data/top_10_non_legendary.json';
import legendary from '../data/top_10_legendary.json';
import TopTenList from './top_ten_list.js';
import TypesChart from './types_charts.js';
import GenCharts from './gen_charts';
import ScrollButton from './scrollbutton';


const LeftSide = () => {
    const [showLists, setShowLists] = useState(false);
    const [showTypeCharts, setShowTypeCharts] = useState(false);

    const fadeLists = useSpring(
        {display: showLists ? 'inline-block' : 'none'},
    );
    const fadeCharts = useSpring( 
        {display: showTypeCharts ? 'inline-block' : 'none'},
    );
    const growPane = useSpring(  
        {   
            width: showTypeCharts || showLists ? '100vw' : '25vw',
            height: '100%',
            background: 'rgb(238, 22, 22, 1)',
        }
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
        <animated.div style={growPane} className="left-pane-container container-fluid">
            <div className="buttons-container">
                
                <button onClick={listEvent} className="top10btn">Top 10 Lists</button>
                <button onClick={chartEvent} className="chartbtn">Chart Data</button>

            </div>  
            <animated.div style={fadeLists} className="lists container-fluid">
                <div className="listRow row">
                    <TopTenList pkmnList={hp} title="by HP" />
                    <TopTenList pkmnList={fastest} title="by Speed" />
                    <TopTenList pkmnList={strongest} title="by Attack" />
                    <TopTenList pkmnList={defense} title="by Defense" />
                    <TopTenList pkmnList={legendary} title="Legendary" />
                    <TopTenList pkmnList={non_legendary} title="Non-Legendary" />
                </div>
            </animated.div>
            
            <animated.div style={fadeCharts} className="graphs container-fluid">
                <TypesChart /> 
                <GenCharts />
            </animated.div>
            <div>
                <ScrollButton />
            </div>
  
        </animated.div>

        
); }

export default LeftSide;