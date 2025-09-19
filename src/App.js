// src/App.js
import './App.css';
import React from 'react';
import Jumbotron from './components/Jumbotron';
import Splitscreen from './components/Splitscreen';
import LeftSide from './components/Leftside';
import RightSide from './components/Rightside';

function App() {
  return (
    <div className="App">
      <Jumbotron />
      <Splitscreen left={LeftSide} right={RightSide} />
    </div>
  );
}

export default App;
