import fastest from '../data/top_10_speed.json';
import strongest from '../data/top_10_attack.json';
import hp from '../data/top_10_hp.json';
import defense from '../data/top_10_defense.json';
import non_legendary from '../data/top_10_non_legendary.json';
import legendary from '../data/top_10_legendary.json';
import TopTenList from './top_ten_list.js';
import TypesChart from './types_charts.js';
import { useState } from 'react';
import {useSpring, animated, config} from 'react-spring';




const Master = () => {
    const [showLists, setShowLists] = useState(false);
    const [showTypeCharts, setShowTypeCharts] = useState(false);
    const fadeLists = useSpring(
        {display: showLists ? 'inline-block' : 'none'}
    );
    const fadeCharts = useSpring( 
        {display: showTypeCharts ? 'inline-block' : 'none'}
    );
    let listEvent = () => {
        setShowLists(!showLists);
        setShowTypeCharts(showTypeCharts ? !showTypeCharts : showTypeCharts);
    }
    let chartEvent = () => {
        setShowTypeCharts(!showTypeCharts);
        setShowLists(showLists ? !showLists : showLists);
    }
    
    return (
        <div className="main-div">
            <div className="container container-fluid">
                <div className="row">
                    <div className="col-md-6 col-xs-12">
                        <button onClick={listEvent} className="top10btn btn-primary">Top 10 Pokemon</button>
                    </div>
                    <div className="col-md-6 col-xs-12">
                        <button onClick={chartEvent} className="chartbtn btn-success">Charts and Graphs</button>
                    </div>
                    
                    <div className="col-md-6 col-xs-12">
                        <button className="top10btn btn-warning">Pokemon Fun Facts</button>
                    </div>
                    <div className="col-md-6 col-xs-12">
                        <button className="top10btn btn-danger">The Pokemon Quiz</button>
                    </div> 
                </div>
            </div>
            
                
            
            <animated.div style={fadeLists} className="lists container container-fluid" >
                <div className="topList row">
                    <TopTenList pkmnList={hp} title="by HP" />
                    <TopTenList pkmnList={fastest} title="by Speed" />
                    <TopTenList pkmnList={strongest} title="by Attack" />
                    <TopTenList pkmnList={defense} title="by Defense" />
                    <TopTenList pkmnList={legendary} title="Legendary" />
                    <TopTenList pkmnList={non_legendary} title="Non-Legendary" />  
                </div>
            </animated.div>
            <animated.div style={fadeCharts} className="graphs container container-fluid" >
                <TypesChart /> 
            </animated.div>
            
           
        </div>
    )
}

export default Master;



/*  */