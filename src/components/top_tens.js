import fastest from '../data/top_10_speed.json';
import strongest from '../data/top_10_attack.json';
import hp from '../data/top_10_hp.json';
import defense from '../data/top_10_defense.json';
import non_legendary from '../data/top_10_non_legendary.json';
import legendary from '../data/top_10_legendary.json';
import TopTenList from './top_ten_list.js';
import {useState} from 'react';


const TopTens = () => {
    const [show, setShow] = useState(false);
    return (
        <div className="top10-div">
            <div className="container container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <button onClick={() => setShow(!show)} className="top10btn btn-primary">Top 10 Pokemon</button>
                    </div>
                    <div className="col-md-6">
                        <button className="top10btn btn-success">Charts and Graphs</button>
                    </div>
                    <div className="col-md-6">
                        <button className="top10btn btn-warning">Pokemon Fun Facts</button>
                    </div>
                    <div className="col-md-6">
                        <button className="top10btn btn-danger">The Pokemon Quiz</button>
                    </div>
                </div>
            </div>
            <div className="container container-fluid" style={{ display: (show ? 'inline-block' : 'none') }}>
                <div className="row">
                    <TopTenList pkmnList={hp} title="by HP" />
                    <TopTenList pkmnList={fastest} title="by Speed" />
                    <TopTenList pkmnList={strongest} title="by Attack" />
                    <TopTenList pkmnList={defense} title="by Defense" />
                    <TopTenList pkmnList={legendary} title="Legendary" />
                    <TopTenList pkmnList={non_legendary} title="Non-Legendary" />
                </div>    
            </div> 
        </div>
    )
}

export default TopTens;
