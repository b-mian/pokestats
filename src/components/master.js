import fastest from '../data/top_10_speed.json';
import strongest from '../data/top_10_attack.json';
import hp from '../data/top_10_hp.json';
import defense from '../data/top_10_defense.json';
import non_legendary from '../data/top_10_non_legendary.json';
import legendary from '../data/top_10_legendary.json';
import TopTenList from './top_ten_list.js';
import TypesChart from './types_charts.js';
import { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import GenCharts from './gen_charts';

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
        e.preventDefault()
        setShowLists(!showLists);
        setShowTypeCharts(showTypeCharts ? !showTypeCharts : showTypeCharts);
    }
    let chartEvent = (e) => {
        e.preventDefault()
        setShowTypeCharts(!showTypeCharts);
        setShowLists(showLists ? !showLists : showLists);
    }
    
    return (
        <div className="main-div">
            <div className="container-fluid">
                <div className="row">
                    <div className="buttons">
                        <button onClick={listEvent} className="top10btn">Top 10 Pokemon</button>
                        <button onClick={chartEvent} className="chartbtn">Pokemon Charts</button>
                        <button className="quizBtn">Pokemon Quiz</button>
                    </div>
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
        </div>
    )
}

export default Master;



/*  */