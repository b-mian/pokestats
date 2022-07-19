import React from 'react';

function headings(pkmnData) {
    let pkmn = [];
    for (let i=0; i<pkmnData.length; i++) {
        pkmn.push(    
                <tr className="top-10-pkmn-list-row">
                    <td className="pkmn-images">
                        <img alt="pkmn" className="pokemon-images" src={`/images/icons/${pkmnData[i][1]}.png`}></img>
                    </td>
                    <td className="pkmn-name">{pkmnData[i][0]}</td>
                    <td className="pkmn-stat">{pkmnData[i][2]}</td>
                </tr>
        );            
    }
    return pkmn;
}

const TopTenList = ({pkmnList, title}) => {
    return ( 
        <div className="list">
            <h4 className="title">Top 10 {title}</h4>
            <ol className="top-10-list">
                {headings(pkmnList).map((value, index) => {
                    return <li key={index}>{value}</li>
                })} 
            </ol>
        </div>
    )
}

export default TopTenList;