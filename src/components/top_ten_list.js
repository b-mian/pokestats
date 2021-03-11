function headings(pkmn_list) {
    let pkmn_array = [];
    for (let i=0; i<pkmn_list.length; i++) {
        pkmn_array.push(    
                        <tr>
                            <td className="pkmn-images">
                                <img alt="pkmn" className="pokemon-images" src={`/images/icons/${pkmn_list[i][1]}.png`}></img>
                            </td>
                            <td className="pkmn-name">{pkmn_list[i][0]}</td>
                            <td className="pkmn-stat">{pkmn_list[i][2]}</td>
                        </tr>
        );            
    }
    return pkmn_array;
}

const TopTenList = ({pkmnList, title}) => {
    return ( 
        <div className="col-md-4 col-sm-6 col-xs-12">
            <table>
                <thead className="title">Top 10 {title}</thead>
                {headings(pkmnList).map((value, index) => {
                    return <h5 key={index}>{value}</h5>
                })} 
            </table>
        </div>
    )
}

export default TopTenList;