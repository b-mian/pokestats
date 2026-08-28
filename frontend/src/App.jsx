// src/App.js
import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Jumbotron from './components/Jumbotron';
import Splitscreen from './components/Splitscreen';
import LeftSide from './components/Leftside';
import RightSide from './components/Rightside';
import PageNav from './components/PageNav';
import DetailPage from './pages/DetailPage';
import ComparePage from './pages/ComparePage';
import TeamBuilderPage from './pages/TeamBuilderPage';
import ExplorerPage from './pages/ExplorerPage';
import QuizPage from './pages/QuizPage';
import HigherLowerPage from './pages/HigherLowerPage';

function Home() {
  return (
    <>
      <Jumbotron />
      <Splitscreen left={LeftSide} right={RightSide} />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <PageNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pokemon/:id" element={<DetailPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/team" element={<TeamBuilderPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/games/higher-lower" element={<HigherLowerPage />} />
      </Routes>
    </div>
  );
}

export default App;
