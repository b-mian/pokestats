import {useState, useEffect} from 'react';
import types from '../data/types.json';
import types1_freq from '../data/types1_freq.json';
import types2_freq from '../data/types2_freq.json';
import colours from '../data/chart_colours.json';
import { HorizontalBar } from 'react-chartjs-2';



const TypesChart = () => {
    const [show, setShow] = useState(false);
    const [chart1Data, setChart1Data] = useState({});
    const [chart2Data, setChart2Data] = useState({});
    const chart1 = (typesList, typesData, typeNum) => {
        setChart1Data({
            labels: typesList,
            datasets: [
                {
                    label: `Number of Pokemon By Type ${typeNum}`,
                    data: typesData,
                    backgroundColor: colours,
                    borderWidth: 1,
                    borderColor: 'black' 
                } 
            ]
        });
    }

    const chart2 = (typesList, typesData, typeNum) => {
        setChart2Data({
            labels: typesList,
            datasets: [
                {
                    label: `Number of Pokemon By Type ${typeNum}`,
                    data: typesData,
                    backgroundColor: colours,
                    borderWidth: 1,
                    borderColor: 'black' 
                } 
            ]
        });
    }

    useEffect(() => {
        chart1(types, types1_freq, '1');
        chart2(types, types2_freq, '2');
    }, [])

    return (
        <div className="chartsDiv">
            <div className="container container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <button onClick={() => setShow(!show)} className="chartbtn btn-success">Charts and Graphs</button>
                    </div>
                </div>
            </div>
            <div className="graphs container container-fluid" style={{ display: (show ? 'inline-block' : 'none') }}>
                <HorizontalBar data={chart1Data}></HorizontalBar>
                <HorizontalBar data={chart2Data}></HorizontalBar>
            </div>
        </div>
    )
}

export default TypesChart;