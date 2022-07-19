// import logo from './logo.svg';
import './App.css';
import Jumbotron from './components/jumbotron';
import React from 'react';
import Splitscreen from './components/splitscreen';
import LeftSide from './components/leftside';
import RightSide from './components/rightside';



function App() {
  return (
    <div className="App">
      <Jumbotron />
      <Splitscreen left={LeftSide} right={RightSide} />
    </div>
  );
}

export default App;
