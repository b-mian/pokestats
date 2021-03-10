import fastest from '../data/top_10_speed.json';
import strongest from '../data/top_10_attack.json';
import hp from '../data/top_10_hp.json';
import defense from '../data/top_10_defense.json';
import non_legendary from '../data/top_10_non_legendary.json';
import legendary from '../data/top_10_legendary.json';
import {useState} from 'react';

function headings(pkmn_list) {
    let pkmn_array = [];
    for (let i=0; i<pkmn_list.length; i++) {
        pkmn_array.push(<table>
                            <thead></thead>
                            <tbody>
                                <tr>
                                    <td className="pkmn-images">
                                        <img alt="pkmn" className="pokemon-images" src={`/images/icons/${pkmn_list[i][1]}.png`}></img>
                                    </td>
                                    <td>
                                        {pkmn_list[i][0] + "    "}
                                    </td>
                                    <td>
                                        {pkmn_list[i][2]}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
        )            
    }
    return pkmn_array;
}

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
                    <div className="col-md-4 col-sm-6 col-xs-12">
                        <ul className="pkmn-lists">
                            <li class="title">Top 10 by Speed</li>
                            {headings(fastest).map((value, index) => {
                                return <li key={index}>{value}</li>
                            })} 
                        </ul>
                    </div>
                    <div className="col-md-4 col-sm-6 col-xs-12">
                        <ul className="pkmn-lists">
                            <li class="title">Top 10 by Attack</li>
                            {headings(strongest).map((value, index) => {
                                return <li key={index}>{value}</li>
                            })}
                        </ul>
                    </div>
                    <div className="col-md-4 col-sm-6 col-xs-12">
                        <ul className="pkmn-lists">
                            <li class="title">Top 10 by Defense</li>
                            {headings(defense).map((value, index) => {
                                return <li key={index}>{value}</li>
                            })}
                        </ul>
                    </div>
                    <div className="col-md-4 col-sm-6 col-xs-12">
                        <ul className="pkmn-lists">
                            <li class="title">Top 10 by HP</li>
                            {headings(hp).map((value, index) => {
                                return <li key={index}>{value}</li>
                            })}
                        </ul>
                    </div>
                    <div className="col-md-4 col-sm-6 col-xs-12">
                        <ul className="pkmn-lists">
                            <li class="title">Top 10 Non-Legendaries</li>
                            {headings(non_legendary).map((value, index) => {
                                return <li key={index}>{value}</li>
                            })}
                        </ul>
                    </div>
                    <div className="col-md-4 col-sm-6 col-xs-12">
                        <ul className="pkmn-lists">
                            <li class="title">Top 10 Legendaries</li>
                            {headings(legendary).map((value, index) => {
                                return <li key={index}>{value}</li>
                            })}
                        </ul>
                    </div>
                </div>
                
                 
                  
            </div> 
        </div>
    )
}

export default TopTens;