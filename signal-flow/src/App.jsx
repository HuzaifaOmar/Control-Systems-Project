import React, { useState } from 'react';
import SignalFlowGraph from './components/SignalFlowGraph';
import RouthStabilityChecker from './components/RouthStabilityChecker';
import './styles/App.css';

const App = () => {
  const [page, setPage] = useState('welcome');
  const [transferFunction, setTransferFunction] = useState('');
  const [stabilityResult, setStabilityResult] = useState('');

  const renderPage = () => {
    switch (page) {
      case 'signalFlow':
        return (
          <div>
            <button className="custom-button" onClick={() => setPage('welcome')}>
              ⬅️ Back to Home
            </button>
            <SignalFlowGraph setTransferFunction={setTransferFunction} />
            {transferFunction && (
              <div className="result-card">
                <h3>Transfer Function Result</h3>
                <p>{transferFunction}</p>
              </div>
            )}
          </div>
        );
      case 'stability':
        return (
          <div>
            <button className="custom-button" onClick={() => setPage('welcome')}>
              ⬅️ Back to Home
            </button>
            <RouthStabilityChecker setStabilityResult={setStabilityResult} />
            {stabilityResult && (
              <div className="result-card">
                <h3>Stability Result</h3>
                <p>{stabilityResult}</p>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="welcome-container">
            <h1>Welcome to Control System Tools</h1>
            <p>Choose an option to get started:</p>
            <div className="button-container">
              <button className="custom-button" onClick={() => setPage('signalFlow')}>
                Signal Flow Graph
              </button>
              <button className="custom-button" onClick={() => setPage('stability')}>
                Stability Analyzer
              </button>
            </div>
          </div>
        );
    }
  };

  return <div className="app-container">{renderPage()}</div>;
};

export default App;
