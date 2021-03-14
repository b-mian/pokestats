import logo from './logo.svg';
import './App.css';
import Jumbotron from './components/jumbotron';
import TopTens from './components/top_tens';
import TypesChart from './components/types_charts';


function App() {
  return (
    <div className="App">
      <Jumbotron />
      <TopTens />
      <TypesChart />
    </div>
  );
}

export default App;
