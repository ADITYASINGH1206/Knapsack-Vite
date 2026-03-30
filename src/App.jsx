import { useState, useEffect } from 'react';

function App() {
  const [capacity, setCapacity] = useState('');
  const [items, setItems] = useState([]);
  const [weightInput, setWeightInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [itemNameInput, setItemNameInput] = useState('');
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [knapsackType, setKnapsackType] = useState('FRACTIONAL'); // 'FRACTIONAL' or '01'

  const addItem = () => {
    if (weightInput && valueInput) {
      const newItem = {
        id: Date.now(),
        name: itemNameInput || `Item ${items.length + 1}`,
        weight: parseFloat(weightInput),
        value: parseFloat(valueInput),
        ratio: parseFloat(valueInput) / parseFloat(weightInput)
      };
      setItems([...items, newItem]);
      setWeightInput('');
      setValueInput('');
      setItemNameInput('');
    }
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateFractionalKnapsack = (cap, currentItems) => {
    let stepsArr = [];
    let sortedItems = [...currentItems].sort((a, b) => b.ratio - a.ratio);

    stepsArr.push({
      type: 'SORTING',
      message: 'Sorted all items by Value-to-Weight ratio (V/W).',
      items: sortedItems,
      knapsack: { currentWeight: 0, totalValue: 0, remaining: cap }
    });

    let totalValue = 0;
    let currentWeight = 0;
    let selectedItems = [];

    for (let i = 0; i < sortedItems.length; i++) {
      let item = sortedItems[i];
      let remainingCap = cap - currentWeight;

      if (currentWeight + item.weight <= cap) {
        currentWeight += item.weight;
        totalValue += item.value;
        const selection = { ...item, fraction: 1, takenValue: item.value, takenWeight: item.weight };
        selectedItems.push(selection);

        stepsArr.push({
          type: 'PICKING',
          message: `Taking full ${item.name}.`,
          item: item,
          selection: selection,
          knapsack: { currentWeight, totalValue, remaining: cap - currentWeight }
        });
      } else {
        if (remainingCap > 0) {
          let fraction = remainingCap / item.weight;
          let takenValue = item.value * fraction;
          totalValue += takenValue;
          const selection = { ...item, fraction, takenValue, takenWeight: remainingCap };
          selectedItems.push(selection);
          currentWeight += remainingCap;

          stepsArr.push({
            type: 'FRACTIONAL_PICK',
            message: `Taking ${(fraction * 100).toFixed(1)}% of ${item.name} to fill remaining capacity.`,
            item: item,
            selection: selection,
            knapsack: { currentWeight, totalValue, remaining: 0 }
          });
        }
        break;
      }
    }

    return { totalValue, selectedItems, steps: stepsArr };
  };

  const calculate01Knapsack = (cap, currentItems) => {
    let stepsArr = [];
    const n = currentItems.length;
    
    stepsArr.push({
      type: 'INITIALIZATION',
      message: 'Initial state: Scanning item manifest for 0-1 selection...',
      knapsack: { currentWeight: 0, totalValue: 0, remaining: cap }
    });

    const memo = new Map();
    const solve = (idx, remaining) => {
      if (idx === n || remaining <= 0) return 0;
      const key = `${idx}-${remaining}`;
      if (memo.has(key)) return memo.get(key);

      let res;
      const item = currentItems[idx];
      if (item.weight <= remaining) {
        res = Math.max(
          item.value + solve(idx + 1, remaining - item.weight),
          solve(idx + 1, remaining)
        );
      } else {
        res = solve(idx + 1, remaining);
      }
      memo.set(key, res);
      return res;
    };

    const finalValue = solve(0, cap);
    
    // Trace back for steps and selected items
    let currentCap = cap;
    let selectedItems = [];
    let totalWeight = 0;
    let totalValue = 0;

    for (let i = 0; i < n; i++) {
      const item = currentItems[i];
      if (item.weight <= currentCap) {
        const takeValue = item.value + solve(i + 1, currentCap - item.weight);
        const leaveValue = solve(i + 1, currentCap);

        if (takeValue >= leaveValue) {
          totalValue += item.value;
          totalWeight += item.weight;
          const selection = { ...item, fraction: 1, takenValue: item.value, takenWeight: item.weight };
          selectedItems.push(selection);
          
          stepsArr.push({
            type: 'PICKING',
            message: `Taking ${item.name} entirely.`,
            item: item,
            selection: selection,
            knapsack: { currentWeight: totalWeight, totalValue: totalValue, remaining: cap - totalWeight }
          });
          currentCap -= item.weight;
        } else {
          stepsArr.push({
            type: 'SKIP',
            message: `Skipping ${item.name} (Higher value combinations found without it).`,
            item: item,
            knapsack: { currentWeight: totalWeight, totalValue: totalValue, remaining: cap - totalWeight }
          });
        }
      } else {
        stepsArr.push({
          type: 'SKIP',
          message: `Skipping ${item.name} (Too heavy for remaining capacity).`,
          item: item,
          knapsack: { currentWeight: totalWeight, totalValue: totalValue, remaining: cap - totalWeight }
        });
      }
    }

    return { totalValue: finalValue, selectedItems, steps: stepsArr };
  };

  const handleCalculate = () => {
    const parsedCapacity = parseFloat(capacity);
    if (!isNaN(parsedCapacity) && parsedCapacity > 0) {
      const res = knapsackType === 'FRACTIONAL' 
        ? calculateFractionalKnapsack(parsedCapacity, items)
        : calculate01Knapsack(parsedCapacity, items);
      setResult(res);
      setSteps(res.steps);
      setCurrentStep(0);
    }
  };

  const reset = () => {
    setResult(null);
    setSteps([]);
    setCurrentStep(-1);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E2E8F0] font-['Inter'] selection:bg-[#00E5FF]/30 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold tracking-tight text-[#00E5FF] mb-2">
            NEC Project
          </h1>
          <p className="text-[#94A3B8] font-medium tracking-wide uppercase text-xs">
            {knapsackType === 'FRACTIONAL' ? 'Fractional Knapsack' : '0/1 Knapsack'}
          </p>
        </div>
        
        {/* Knapsack Type Selector */}
        {!result && (
          <div className="flex bg-[#0F172A] p-1 rounded-xl border border-[#334155] self-center">
            <button
              onClick={() => setKnapsackType('FRACTIONAL')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${knapsackType === 'FRACTIONAL' ? 'bg-[#00E5FF] text-[#083344] shadow-lg' : 'text-[#64748B] hover:text-white'}`}
            >
              FRACTIONAL
            </button>
            <button
              onClick={() => setKnapsackType('01')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${knapsackType === '01' ? 'bg-[#00E5FF] text-[#083344] shadow-lg' : 'text-[#64748B] hover:text-white'}`}
            >
              0/1 MODE
            </button>
          </div>
        )}

        {result && (
          <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-[#00E5FF]/20 px-8 py-4 rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.1)]">
            <span className="block text-[#94A3B8] text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Total Optimized Profit</span>
            <span className="text-3xl font-['JetBrains_Mono'] font-bold text-white tracking-tighter">
              {result.totalValue.toFixed(4)}
            </span>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Capacity Input */}
          <section className="bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] p-6 rounded-xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#00E5FF] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-4">Knapsack Capacity</label>
            <input
              type="number"
              placeholder="0.00"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full bg-[#0F172A] border-none text-2xl font-['JetBrains_Mono'] p-4 rounded-lg focus:ring-1 focus:ring-[#00E5FF]/40 text-white placeholder-[#334155] transition-all"
            />
          </section>

          {/* Add Item Form */}
          <section className="bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] p-6 rounded-xl shadow-xl space-y-4">
            <h2 className="text-sm font-['Space_Grotesk'] font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></span>
              Inject New Manifest Item
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Item Label (e.g., Gold Dust)"
                value={itemNameInput}
                onChange={(e) => setItemNameInput(e.target.value)}
                className="w-full bg-[#0F172A] border-none text-sm p-3 rounded-lg focus:ring-1 focus:ring-[#00E5FF]/40 text-[#CBD5E1] placeholder-[#475569]"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#64748B] uppercase font-bold mb-1 ml-1">Weight</label>
                  <input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full bg-[#0F172A] border-none text-base font-['JetBrains_Mono'] p-3 rounded-lg focus:ring-1 focus:ring-[#00E5FF]/40 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#64748B] uppercase font-bold mb-1 ml-1">Value</label>
                  <input
                    type="number"
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    className="w-full bg-[#0F172A] border-none text-base font-['JetBrains_Mono'] p-3 rounded-lg focus:ring-1 focus:ring-[#00E5FF]/40 text-white"
                  />
                </div>
              </div>
              <button
                onClick={addItem}
                className="w-full bg-[#00E5FF] text-[#083344] py-4 rounded-lg font-['Space_Grotesk'] font-bold text-sm tracking-wide uppercase hover:bg-[#22D3EE] active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(0,229,255,0.2)]"
              >
                Add to Manifest
              </button>
            </div>
          </section>

          {/* Solve / Reset Button */}
          {!result ? (
            <button
              onClick={handleCalculate}
              disabled={items.length === 0 || !capacity}
              className="w-full bg-white text-black py-5 rounded-xl font-['Space_Grotesk'] font-bold text-lg tracking-wider uppercase hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-2xl"
            >
              Execute Logic Engine
            </button>
          ) : (
            <button
              onClick={reset}
              className="w-full border border-[#334155] text-white py-5 rounded-xl font-['Space_Grotesk'] font-bold text-lg tracking-wider uppercase hover:bg-white/5 transition-all"
            >
              Reset Terminal
            </button>
          )}
        </div>

        {/* Right Column: List & Visualization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Steps Visualization */}
          {currentStep >= 0 && (
            <section className="bg-[#111827]/90 border border-[#00E5FF]/30 p-8 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-['Space_Grotesk'] font-bold text-white flex items-center gap-3">
                  <span className="px-2 py-1 bg-[#1E293B] border border-[#334155] rounded text-xs text-[#00E5FF]">Step {currentStep + 1}/{steps.length}</span>
                  Processing Logic
                </h2>
                <div className="flex gap-3">
                  <button
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="p-3 bg-[#1E293B] border border-[#334155] rounded-full hover:bg-[#334155] disabled:opacity-20 transition-all text-[#00E5FF]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    disabled={currentStep === steps.length - 1}
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="p-3 bg-[#1E293B] border border-[#334155] rounded-full hover:bg-[#334155] disabled:opacity-20 transition-all text-[#00E5FF]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {/* Step Detail */}
              <div className="space-y-8">
                <p className="text-lg text-[#CBD5E1] font-medium leading-relaxed italic border-l-4 border-[#00E5FF] pl-6 py-2">
                  {steps[currentStep].message}
                </p>

                {/* Knapsack Visualizer */}
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-1">
                    <span className="text-[#94A3B8]">Capacity Saturation</span>
                    <span className="text-[#00E5FF]">{((steps[currentStep].knapsack.currentWeight / parseFloat(capacity)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-4 w-full bg-[#1E293B] rounded-full overflow-hidden p-1 border border-[#334155] shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#00E5FF] to-[#22D3EE] rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                      style={{ width: `${(steps[currentStep].knapsack.currentWeight / parseFloat(capacity)) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-[#0F172A] p-5 rounded-xl border border-[#1F2937] shadow-lg">
                      <span className="block text-[10px] text-[#64748B] uppercase font-bold mb-2">Captured Weight</span>
                      <span className="text-2xl font-['JetBrains_Mono'] text-white font-bold">{steps[currentStep].knapsack.currentWeight.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#0F172A] p-5 rounded-xl border border-[#1F2937] shadow-lg">
                      <span className="block text-[10px] text-[#64748B] uppercase font-bold mb-2">Captured Value</span>
                      <span className="text-2xl font-['JetBrains_Mono'] text-[#22D3EE] font-bold">{steps[currentStep].knapsack.totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Current Manifest */}
          {!result && (
            <section className="bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] p-8 rounded-2xl shadow-xl">
              <h2 className="text-xl font-['Space_Grotesk'] font-bold text-white mb-8 flex justify-between items-center">
                Current Manifest
                <span className="text-xs bg-[#1F2937] text-[#94A3B8] px-3 py-1 rounded-full font-medium uppercase tracking-tight">{items.length} units detected</span>
              </h2>
              {items.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-30">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <p className="text-center font-['Space_Grotesk'] text-lg font-medium tracking-wide">Terminal Idle. Please inject items.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#334155]/30">
                        <th className="py-5 text-[10px] uppercase font-bold text-[#64748B] tracking-widest pl-2">Item Class</th>
                        <th className="py-5 text-[10px] uppercase font-bold text-[#64748B] tracking-widest text-right">Wgt</th>
                        <th className="py-5 text-[10px] uppercase font-bold text-[#64748B] tracking-widest text-right">Val</th>
                        <th className="py-5 text-[10px] uppercase font-bold text-[#64748B] tracking-widest text-right pr-4">V/W Ratio</th>
                        <th className="py-5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]/20 font-['JetBrains_Mono']">
                      {items.map((item) => (
                        <tr key={item.id} className="group hover:bg-[#1E293B]/40 transition-colors">
                          <td className="py-5 font-bold text-sm text-[#E2E8F0] pl-2">{item.name}</td>
                          <td className="py-5 text-sm text-right text-[#94A3B8]">{item.weight}</td>
                          <td className="py-5 text-sm text-right text-[#94A3B8]">{item.value}</td>
                          <td className="py-5 text-sm font-bold text-right text-[#00E5FF] pr-4">{item.ratio.toFixed(2)}</td>
                          <td className="py-5 text-right w-10">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:text-rose-400 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Final Manifest Section */}
          {result && (
            <section className="bg-[#111827]/80 border border-[#1F2937] p-8 rounded-2xl shadow-xl">
              <h2 className="text-xl font-['Space_Grotesk'] font-bold text-white mb-8">
                Optimized Selection Result
              </h2>
              <ul className="space-y-4 font-['JetBrains_Mono']">
                {result.selectedItems.map((item, index) => (
                  <li key={index} className="bg-[#0F172A] p-5 rounded-xl border border-[#1F2937] flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <span className="block text-[10px] text-[#00E5FF] uppercase font-bold mb-1">{item.name}</span>
                      <span className="text-sm text-[#94A3B8]">Taken Weight: <span className="text-white font-bold">{item.takenWeight.toFixed(2)}</span> / {item.weight}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="block text-[10px] text-[#64748B] uppercase font-bold mb-1">Profit Contribution</span>
                        <span className="text-sm font-bold text-[#E2E8F0]">+{item.takenValue.toFixed(2)}</span>
                      </div>
                      <div className="h-10 w-1 bg-[#1F2937]"></div>
                      <div className="min-w-[80px] text-right">
                        <span className="block text-[10px] text-[#64748B] uppercase font-bold mb-1">Portion</span>
                        <span className="px-2 py-1 bg-[#00E5FF]/10 text-[#00E5FF] text-[10px] font-bold rounded-md">
                          {(item.fraction * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-7xl mx-auto mt-20 pb-12 text-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#334155]/30 to-transparent mb-8"></div>
        <p className="text-[10px] text-[#475569] uppercase font-bold tracking-[0.5em]">Built by ADITYA RAJ GUPTA & SHARAD POLACKAL SUNIL</p>
      </footer>
    </div>
  );
}

export default App;