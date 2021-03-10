import logo from './logo.svg';
import './App.css';
import Jumbotron from './components/jumbotron';
import TopTens from './components/top_tens';


function App() {
  return (
    <div className="App">
      <Jumbotron />
      <TopTens />
    </div>
  );
}

export default App;
