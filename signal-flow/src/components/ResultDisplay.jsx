import React from 'react';

const ResultDisplay = ({ 
  transferFunction, 
  stabilityResult,
  forwardPaths,
  loops,
  nonTouchingLoops,
  deltas 
}) => {
  return (
    <div className="card results-container">
      <h2>Analysis Results</h2>
      
      <div className="result-section">
        <h3>Signal Flow Graph Analysis</h3>
        <div className="result-item">
          <h4>Transfer Function:</h4>
          <p className="result-value">{transferFunction || 'Not calculated yet'}</p>
        </div>
        
        <div className="result-item">
          <h4>Forward Paths ({forwardPaths?.length || 0}):</h4>
          {forwardPaths?.length > 0 ? (
            <ul className="path-list">
              {forwardPaths.map((path, i) => (
                <li key={i}>
                  <span className="path-number">Path {i+1}:</span>
                  <span className="path-nodes">{path.path}</span>
                  <span className="path-gain">(Gain: {path.gain.toFixed(2)})</span>
                  {deltas?.pathDeltas?.[i] !== undefined && (
                    <span className="path-delta">(Δ{i+1}: {deltas.pathDeltas[i].toFixed(2)})</span>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="no-result">No forward paths identified</p>}
        </div>
        
        <div className="result-item">
          <h4>Individual Loops ({loops?.length || 0}):</h4>
          {loops?.length > 0 ? (
            <ul className="loop-list">
              {loops.map((loop, i) => (
                <li key={i}>
                  <span className="loop-number">Loop {i+1}:</span>
                  <span className="loop-nodes">{loop.path}</span>
                  <span className="loop-gain">(Gain: {loop.gain.toFixed(2)})</span>
                </li>
              ))}
            </ul>
          ) : <p className="no-result">No loops identified</p>}
        </div>
        
        <div className="result-item">
          <h4>Non-touching Loops ({nonTouchingLoops?.length || 0} combinations):</h4>
          {nonTouchingLoops?.length > 0 ? (
            <ul className="non-touching-list">
              {nonTouchingLoops.map((group, i) => (
                <li key={i}>
                  <span className="combination-number">Combination {i+1}:</span>
                  {group.map((g, j) => (
                    <React.Fragment key={j}>
                      <span className="loop-nodes">{g.path}</span>
                      {j < group.length - 1 && <span className="and"> and </span>}
                    </React.Fragment>
                  ))}
                  <span className="product-gain">
                    (Product: {group.reduce((acc, g) => acc * g.gain, 1).toFixed(2)})
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="no-result">No non-touching loops found</p>}
        </div>
        
        <div className="result-item">
          <h4>Determinants:</h4>
          <p><strong>Δ (System Determinant):</strong> {deltas?.delta !== undefined ? deltas.delta.toFixed(2) : 'Not calculated'}</p>
          {deltas?.pathDeltas?.map((pd, i) => (
            <p key={i}><strong>Δ{i+1}:</strong> {pd.toFixed(2)}</p>
          ))}
        </div>
      </div>
      
      <div className="result-section">
        <h3>Routh Stability Analysis</h3>
        <div className="result-item">
          <h4>Stability Result:</h4>
          <p className="result-value">{stabilityResult || 'No result yet'}</p>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;