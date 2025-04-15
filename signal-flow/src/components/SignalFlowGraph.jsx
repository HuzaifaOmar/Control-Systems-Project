import React, { useState, useRef, useEffect } from 'react';
import './SignalFlowGraph.css';

const SignalFlowGraph = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDrawingBranch, setIsDrawingBranch] = useState(false);
  const [branchStart, setBranchStart] = useState(null);
  const [branchGain, setBranchGain] = useState('1');
  const [forwardPaths, setForwardPaths] = useState([]);
  const [loops, setLoops] = useState([]);
  const [nonTouchingLoops, setNonTouchingLoops] = useState([]);
  const [deltas, setDeltas] = useState({});
  const [transferFunction, setTransferFunction] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [gainVariables, setGainVariables] = useState({});
  const [nextGainIndex, setNextGainIndex] = useState(1);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw branches
    branches.forEach((branch, index) => {
      drawBranch(ctx, branch, index);
    });
    
    // Draw nodes
    nodes.forEach(node => {
      drawNode(ctx, node);
    });
    
    // Draw temporary branch if in drawing mode
    if (isDrawingBranch && branchStart) {
      ctx.beginPath();
      ctx.moveTo(branchStart.x, branchStart.y);
      ctx.lineTo(branchStart.x + 1, branchStart.y + 1);
      ctx.stroke();
    }
  }, [nodes, branches, isDrawingBranch, branchStart]);

  const drawNode = (ctx, node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = selectedNode === node.id ? '#ffcc00' : '#4CAF50';
    ctx.fill();
    ctx.stroke();
    
    // Draw node name
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.name, node.x, node.y);
  };

  const drawBranch = (ctx, branch, branchIndex) => {
    const startNode = nodes.find(n => n.id === branch.from);
    const endNode = nodes.find(n => n.id === branch.to);
    
    if (!startNode || !endNode) return;
    
    // Calculate direction vector
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate points on the circumference
    const startX = startNode.x + (dx / distance) * 20;
    const startY = startNode.y + (dy / distance) * 20;
    const endX = endNode.x - (dx / distance) * 20;
    const endY = endNode.y - (dy / distance) * 20;
    
    // Calculate control points for a curved arrow
    const angle = Math.atan2(dy, dx);
    
    // Adjust curvature based on branch index to separate parallel branches
    const curveDirection = branchIndex % 2 === 0 ? 1 : -1;
    const curveFactor = 0.3 + (branchIndex % 3) * 0.1; // Vary curvature slightly
    
    const ctrlX = (startX + endX) / 2 + curveFactor * distance * Math.cos(angle + curveDirection * Math.PI/2);
    const ctrlY = (startY + endY) / 2 + curveFactor * distance * Math.sin(angle + curveDirection * Math.PI/2);
    
    // Draw curved line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    // Draw arrowhead at the end
    const arrowAngle = Math.atan2(endY - ctrlY, endX - ctrlX);
    const arrowLength = 10;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
      endY - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
      endY - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
    
    // Draw gain near the middle of the branch
    const textX = (startX + ctrlX * 2 + endX) / 4;
    const textY = (startY + ctrlY * 2 + endY) / 4;
    
    ctx.fillStyle = '#FF0000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(branch.gain, textX, textY);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicked on a node
    const clickedNode = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 20;
    });
    
    if (isDrawingBranch) {
      if (clickedNode) {
        // Finish drawing branch (allow multiple branches between same nodes)
        const newGain = branchGain;
        const newBranch = {
          from: branchStart.id,
          to: clickedNode.id,
          gain: newGain
        };
        setBranches([...branches, newBranch]);
        
        // If the gain is a variable (like g1, g2), add it to our variables list
        if (/^[a-zA-Z]/.test(newGain)) {
          setGainVariables(prev => ({
            ...prev,
            [newGain]: prev[newGain] || newGain
          }));
        }
      }
      setIsDrawingBranch(false);
      setBranchStart(null);
    } else if (clickedNode) {
      // Start drawing branch from this node
      setSelectedNode(clickedNode.id);
      setIsDrawingBranch(true);
      setBranchStart(clickedNode);
      
      // Suggest a new gain variable name
      setBranchGain(`g${nextGainIndex}`);
      setNextGainIndex(nextGainIndex + 1);
    } else {
      // Add new node
      const newNode = {
        id: Date.now(),
        name: nodeName || `N${nodes.length + 1}`,
        x: x,
        y: y
      };
      setNodes([...nodes, newNode]);
      setNodeName('');
    }
  };

  const analyzeGraph = () => {
    if (nodes.length < 2) {
      alert('You need at least 2 nodes to analyze');
      return;
    }
    
    // Find all forward paths (from first node to last node)
    const inputNode = nodes[0].id;
    const outputNode = nodes[nodes.length - 1].id;
    
    const paths = findAllPaths(inputNode, outputNode);
    setForwardPaths(paths);
    
    // Find all individual loops
    const foundLoops = findAllLoops();
    setLoops(foundLoops);
    
    // Find all combinations of non-touching loops
    const nonTouching = findNonTouchingLoops(foundLoops);
    setNonTouchingLoops(nonTouching);
    
    // Calculate deltas and transfer function
    calculateTransferFunction(paths, foundLoops, nonTouching);
  };

  const normalizeGainExpression = (gain) => {
    if (typeof gain !== 'string') return gain;
    
    // Split into multiplicative parts, sort them alphabetically, and rejoin
    const parts = gain.split('*').map(p => p.trim()).filter(p => p !== '1');
    if (parts.length === 0) return '1';
    if (parts.length === 1) return parts[0];
    
    return parts.sort().join('*');
  };

  const simplifyExpression = (expression) => {
    if (typeof expression === 'number') return expression;
    if (!expression.includes('*')) return expression;
    
    const parts = expression.split('*').map(p => p.trim());
    if (parts.includes('1')) {
      return parts.filter(p => p !== '1').join('*') || '1';
    }
    return expression;
  };

  const multiplyGains = (gain1, gain2) => {
    if (gain1 === '1') return gain2;
    if (gain2 === '1') return gain1;
    return `${gain1}*${gain2}`;
  };

  const addGains = (gain1, gain2) => {
    if (gain1 === '0') return gain2;
    if (gain2 === '0') return gain1;
    return `${gain1}+${gain2}`;
  };

  const findAllPaths = (start, end) => {
    const paths = [];
    const visited = new Set();
    
    const dfs = (current, path, currentGain) => {
      visited.add(current);
      path = [...path, current];
      
      if (current === end) {
        paths.push({
          nodes: path,
          gain: simplifyExpression(currentGain)
        });
        visited.delete(current);
        return;
      }
      
      const outgoingBranches = branches.filter(b => b.from === current);
      for (const branch of outgoingBranches) {
        if (!visited.has(branch.to)) {
          const newGain = multiplyGains(currentGain, branch.gain);
          dfs(branch.to, path, newGain);
        }
      }
      
      visited.delete(current);
    };
    
    dfs(start, [], '1');
    return paths;
  };

  const normalizeLoopSignature = (loopNodes) => {
    // Remove the duplicate end node if present
    const uniqueNodes = loopNodes[0] === loopNodes[loopNodes.length - 1] 
      ? loopNodes.slice(0, -1) 
      : loopNodes;
    
    // Find the smallest node ID to use as starting point
    const minNode = Math.min(...uniqueNodes);
    const minIndex = uniqueNodes.indexOf(minNode);
    
    // Rotate the array to start with the smallest node
    const rotated = [...uniqueNodes.slice(minIndex), ...uniqueNodes.slice(0, minIndex)];
    
    // Create signature in both directions and choose the "smaller" one
    const forward = rotated.join(',');
    const backward = [...rotated].reverse().join(',');
    
    return forward < backward ? forward : backward;
  };

  const findAllLoops = () => {
    const loops = [];
    const loopSignatures = new Set();
    
    for (const node of nodes) {
      const visited = new Set();
      const path = [];
      
      const dfs = (current, start, path, currentGain) => {
        visited.add(current);
        path = [...path, current];
        
        const outgoingBranches = branches.filter(b => b.from === current);
        for (const branch of outgoingBranches) {
          if (branch.to === start && path.length > 1) {
            // Found a loop
            const loopNodes = [...path, start];
            const loopGain = multiplyGains(currentGain, branch.gain);
            const normalizedGain = normalizeGainExpression(loopGain);
            
            // Create signatures for both node order and gain
            const nodeSignature = normalizeLoopSignature(loopNodes);
            const combinedSignature = `${nodeSignature}|${normalizedGain}`;
            
            if (!loopSignatures.has(combinedSignature)) {
              loopSignatures.add(combinedSignature);
              
              loops.push({
                nodes: loopNodes,
                gain: simplifyExpression(loopGain),
                signature: combinedSignature,
                normalizedGain: normalizedGain
              });
            }
          } else if (!visited.has(branch.to)) {
            const newGain = multiplyGains(currentGain, branch.gain);
            dfs(branch.to, start, path, newGain);
          }
        }
        
        visited.delete(current);
      };
      
      dfs(node.id, node.id, [], '1');
    }
    
    // Group loops by their normalized gain
    const gainGroups = {};
    loops.forEach(loop => {
      if (!gainGroups[loop.normalizedGain]) {
        gainGroups[loop.normalizedGain] = [];
      }
      gainGroups[loop.normalizedGain].push(loop);
    });
    
    // Create merged loops with all paths for each unique gain
    const mergedLoops = Object.entries(gainGroups).map(([gain, loopGroup]) => {
      return {
        nodes: loopGroup[0].nodes, // Just use one path for display
        gain: loopGroup[0].gain,
        normalizedGain: gain,
        allPaths: loopGroup.map(loop => loop.nodes),
        signature: loopGroup[0].signature
      };
    });
    
    return mergedLoops;
  };

  const findNonTouchingLoops = (allLoops) => {
    const combinations = [];
    
    for (let i = 0; i < allLoops.length; i++) {
      for (let j = i + 1; j < allLoops.length; j++) {
        const loop1Nodes = new Set(allLoops[i].allPaths.flat());
        const loop2Nodes = new Set(allLoops[j].allPaths.flat());
        
        let touching = false;
        for (const node of loop1Nodes) {
          if (loop2Nodes.has(node)) {
            touching = true;
            break;
          }
        }
        
        if (!touching) {
          const combinedGain = multiplyGains(allLoops[i].gain, allLoops[j].gain);
          combinations.push({
            loops: [allLoops[i], allLoops[j]],
            gain: simplifyExpression(combinedGain)
          });
        }
      }
    }
    
    return combinations;
  };

  const calculateTransferFunction = (paths, loops, nonTouching) => {
    let delta = '1';
    
    const individualLoopGains = loops.map(loop => loop.gain);
    if (individualLoopGains.length > 0) {
      delta = addGains(delta, `-(${individualLoopGains.join('+')})`);
    }
    
    const nonTouchingPairGains = nonTouching.map(pair => pair.gain);
    if (nonTouchingPairGains.length > 0) {
      delta = addGains(delta, `+(${nonTouchingPairGains.join('+')})`);
    }
    
    delta = simplifyExpression(delta);
    
    const pathDeltas = {};
    paths.forEach((path, index) => {
      const pathNodes = new Set(path.nodes);
      let deltaK = '1';
      
      const nonTouchingLoopsForPath = loops.filter(loop => {
        const loopNodes = new Set(loop.allPaths.flat());
        for (const node of pathNodes) {
          if (loopNodes.has(node)) {
            return false;
          }
        }
        return true;
      });
      
      if (nonTouchingLoopsForPath.length > 0) {
        const sum = nonTouchingLoopsForPath.map(loop => loop.gain).join('+');
        deltaK = addGains(deltaK, `-(${sum})`);
        
        const nonTouchingPairs = [];
        for (let i = 0; i < nonTouchingLoopsForPath.length; i++) {
          for (let j = i + 1; j < nonTouchingLoopsForPath.length; j++) {
            const loop1Nodes = new Set(nonTouchingLoopsForPath[i].allPaths.flat());
            const loop2Nodes = new Set(nonTouchingLoopsForPath[j].allPaths.flat());
            let touching = false;
            for (const node of loop1Nodes) {
              if (loop2Nodes.has(node)) {
                touching = true;
                break;
              }
            }
            if (!touching) {
              nonTouchingPairs.push(
                multiplyGains(nonTouchingLoopsForPath[i].gain, nonTouchingLoopsForPath[j].gain)
              );
            }
          }
        }
        
        if (nonTouchingPairs.length > 0) {
          deltaK = addGains(deltaK, `+(${nonTouchingPairs.join('+')})`);
        }
      }
      
      pathDeltas[`Δ${index + 1}`] = simplifyExpression(deltaK);
    });
    
    setDeltas({
      Δ: delta,
      ...pathDeltas
    });
    
    let numeratorTerms = [];
    paths.forEach((path, index) => {
      const term = multiplyGains(path.gain, pathDeltas[`Δ${index + 1}`]);
      numeratorTerms.push(term);
    });
    
    const numerator = numeratorTerms.join('+');
    
    setTransferFunction(`T = (${simplifyExpression(numerator)}) / (${delta})`);
  };

  const clearCanvas = () => {
    setNodes([]);
    setBranches([]);
    setForwardPaths([]);
    setLoops([]);
    setNonTouchingLoops([]);
    setDeltas({});
    setTransferFunction('');
    setGainVariables({});
    setNextGainIndex(1);
  };

  const updateGainVariable = (varName, value) => {
    setGainVariables(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  return (
    <div className="signal-flow-container">
      <h1>Signal Flow Graph Analyzer</h1>
      
      <div className="controls">
        <div>
          <label>
            Node Name:
            <input 
              type="text" 
              value={nodeName} 
              onChange={(e) => setNodeName(e.target.value)} 
              placeholder="Optional"
            />
          </label>
        </div>
        
        {isDrawingBranch && (
          <div>
            <label>
              Branch Gain:
              <input 
                type="text" 
                value={branchGain} 
                onChange={(e) => setBranchGain(e.target.value)} 
                placeholder="e.g., g1, 2, -h2"
              />
            </label>
          </div>
        )}
        
        <button onClick={analyzeGraph}>Analyze Graph</button>
        <button onClick={clearCanvas}>Clear Canvas</button>
      </div>
      
      <div className="canvas-container">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500} 
          onClick={handleCanvasClick}
          className="signal-flow-canvas"
        />
      </div>
      
      {Object.keys(gainVariables).length > 0 && (
        <div className="variable-controls">
          <h3>Gain Variables</h3>
          {Object.entries(gainVariables).map(([varName, value]) => (
            <div key={varName} className="variable-control">
              <label>
                {varName}:
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateGainVariable(varName, e.target.value)}
                  placeholder="Expression"
                />
              </label>
            </div>
          ))}
        </div>
      )}
      
      <div className="analysis-results">
        <h2>Analysis Results</h2>
        
        <div className="result-section">
          <h3>Forward Paths</h3>
          {forwardPaths.length > 0 ? (
            <ul>
              {forwardPaths.map((path, index) => (
                <li key={index}>
                  Path {index + 1}: {path.nodes.map(n => nodes.find(node => node.id === n).name).join(' → ')} 
                  (Gain: {path.gain})
                </li>
              ))}
            </ul>
          ) : (
            <p>No forward paths found</p>
          )}
        </div>
        
        <div className="result-section">
          <h3>Individual Loops</h3>
          {loops.length > 0 ? (
            <ul>
              {loops.map((loop, index) => (
                <li key={index}>
                  Loop {index + 1}: {loop.nodes.map(n => nodes.find(node => node.id === n).name).join(' → ')} 
                  (Gain: {loop.gain})
                  {loop.allPaths.length > 1 && (
                    <span> (and {loop.allPaths.length - 1} other path{loop.allPaths.length > 2 ? 's' : ''})</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No loops found</p>
          )}
        </div>
        
        <div className="result-section">
          <h3>Non-Touching Loops</h3>
          {nonTouchingLoops.length > 0 ? (
            <ul>
              {nonTouchingLoops.map((pair, index) => (
                <li key={index}>
                  Pair {index + 1}: 
                  {pair.loops.map((loop, i) => (
                    <span key={i}>
                      {i > 0 && ' and '}
                      Loop {loops.findIndex(l => 
                        l.signature === loop.signature) + 1}
                    </span>
                  ))}
                  (Combined Gain: {pair.gain})
                </li>
              ))}
            </ul>
          ) : (
            <p>No non-touching loops found</p>
          )}
        </div>
        
        <div className="result-section">
          <h3>Determinants</h3>
          {Object.keys(deltas).length > 0 ? (
            <ul>
              {Object.entries(deltas).map(([key, value]) => (
                <li key={key}>{key} = {value}</li>
              ))}
            </ul>
          ) : (
            <p>No determinants calculated</p>
          )}
        </div>
        
        <div className="result-section">
          <h3>Transfer Function</h3>
          {transferFunction ? (
            <p>{transferFunction}</p>
          ) : (
            <p>Transfer function not calculated</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignalFlowGraph;