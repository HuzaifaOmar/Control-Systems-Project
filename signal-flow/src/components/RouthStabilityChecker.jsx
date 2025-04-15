import React, { useState } from 'react';

const RouthStabilityChecker = ({ setStabilityResult }) => {
  const [equation, setEquation] = useState('');
  const [routhArray, setRouthArray] = useState([]);
  const [rhsPoles, setRhsPoles] = useState([]);
  const [localStabilityResult, setLocalStabilityResult] = useState('');

  const buildRouthArray = (coefficients) => {
    const n = coefficients.length;
    let routh = [];
    
    // First two rows
    routh[0] = coefficients.filter((_, i) => i % 2 === 0);
    routh[1] = coefficients.filter((_, i) => i % 2 === 1);
    
    // Fill remaining rows
    for (let i = 2; i < n; i++) {
      routh[i] = [];
      for (let j = 0; j < routh[i-2].length - 1; j++) {
        const a = routh[i-1][0];
        const b = routh[i-1][j+1] || 0;
        const c = routh[i-2][0];
        const d = routh[i-2][j+1] || 0;
        routh[i][j] = (a * d - b * c) / a;
      }
      
      // Handle zero row case
      if (routh[i].every(val => val === 0)) {
        const prevRow = routh[i-1];
        const derivativeCoeffs = prevRow.map((coeff, idx) => 
          coeff * (prevRow.length - idx - 1)
        ).slice(0, -1);
        routh[i] = derivativeCoeffs;
      }
    }
    
    return routh;
  };

  const handleCheckStability = () => {
    try {
      // Normalize equation string
      let normalizedEq = equation.replace(/\s+/g, '');
      
      // Extract coefficients
      const terms = normalizedEq.split(/(?=[+-])/);
      const maxPower = Math.max(...terms.map(term => {
        const match = term.match(/s\^(\d+)/);
        return match ? parseInt(match[1]) : term.includes('s') ? 1 : 0;
      }));
      
      // Initialize coefficients array
      const coefficients = Array(maxPower + 1).fill(0);
      
      // Fill coefficients
      terms.forEach(term => {
        let power, coeff;
        
        if (term.includes('s^')) {
          const parts = term.split('s^');
          power = parseInt(parts[1]);
          coeff = parts[0] === '+' ? 1 : 
                 parts[0] === '-' ? -1 : 
                 parts[0] === '' ? 1 : parseFloat(parts[0]);
        } 
        else if (term.includes('s')) {
          power = 1;
          const numPart = term.replace('s', '');
          coeff = numPart === '+' ? 1 : 
                 numPart === '-' ? -1 : 
                 numPart === '' ? 1 : parseFloat(numPart);
        } 
        else {
          power = 0;
          coeff = parseFloat(term);
        }
        
        coefficients[maxPower - power] = coeff;
      });
      
      // Check for invalid coefficients
      if (coefficients.some(c => isNaN(c))) {
        throw new Error('Invalid equation format');
      }
      
      // Check necessary condition for stability
      const firstSign = Math.sign(coefficients[0]);
      if (coefficients.some(c => Math.sign(c) !== firstSign && c !== 0)) {
        const result = 'Unstable: Coefficients have different signs';
        setLocalStabilityResult(result);
        setStabilityResult(result);
        setRhsPoles(['N/A - System fails necessary condition']);
        return;
      }
      
      // Build Routh array
      const routh = buildRouthArray(coefficients);
      setRouthArray(routh);
      
      // Check for sign changes
      const firstColumn = routh.map(row => row[0]);
      let signChanges = 0;
      let poles = [];
      
      for (let i = 1; i < firstColumn.length; i++) {
        if (firstColumn[i-1] * firstColumn[i] < 0) {
          signChanges++;
          
          // Estimate pole locations
          if (i < firstColumn.length - 1) {
            const a = firstColumn[i-1];
            const b = firstColumn[i];
            const c = firstColumn[i+1];
            
            if (a !== 0 && b !== 0) {
              const discriminant = b*b - 4*a*c;
              if (discriminant >= 0) {
                const root1 = (-b + Math.sqrt(discriminant)) / (2*a);
                const root2 = (-b - Math.sqrt(discriminant)) / (2*a);
                if (root1 > 0) poles.push(root1.toFixed(4));
                if (root2 > 0) poles.push(root2.toFixed(4));
              }
            }
          }
        }
      }
      
      setRhsPoles(poles);
      
      // Set results
      if (signChanges > 0) {
        const result = `Unstable System - ${signChanges} sign change(s) in first column`;
        setLocalStabilityResult(result);
        setStabilityResult(result);
      } else {
        const result = 'Stable System - No sign changes in first column';
        setLocalStabilityResult(result);
        setStabilityResult(result);
      }
    } catch (error) {
      const result = `Error: ${error.message}`;
      setLocalStabilityResult(result);
      setStabilityResult(result);
    }
  };

  return (
    <div className="card">
      <h2>Routh Stability Checker</h2>
      <div className="input-group">
        <input
          type="text"
          placeholder="e.g., s^5+s^4+10s^3+72s^2+152s+240"
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          className="equation-input"
        />
        <button onClick={handleCheckStability} className="check-button">
          Check Stability
        </button>
      </div>
      
      {routhArray.length > 0 && (
        <div className="analysis-results">
          <h3>Routh Array</h3>
          <div className="routh-table-container">
            <table className="routh-table">
              <tbody>
                {routhArray.map((row, i) => (
                  <tr key={i}>
                    <td className="power-cell">s<sup>{routhArray.length - i - 1}</sup></td>
                    {row.map((val, j) => (
                      <td key={j} className="value-cell">
                        {typeof val === 'number' ? val.toFixed(4) : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="stability-result">
            <h3>Stability Analysis</h3>
            <p><strong>Result:</strong> {localStabilityResult}</p>
            {rhsPoles.length > 0 && (
              <p>
                <strong>Poles in RHS:</strong> {rhsPoles.length} pole(s) - 
                {rhsPoles.map((pole, i) => (
                  <span key={i}> {pole}{i < rhsPoles.length - 1 ? ',' : ''}</span>
                ))}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouthStabilityChecker;