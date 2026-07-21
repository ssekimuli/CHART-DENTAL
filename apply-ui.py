import re

file_path = 'src/app/(dashboard)/patients/[id]/charting/components/periodontal-chart.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add threeAtATime state and toothSequence
content = content.replace(
    'const [selectedTooth, setSelectedTooth] = useState<number | undefined>();',
    'const [selectedTooth, setSelectedTooth] = useState<number | undefined>();\n  const [threeAtATime, setThreeAtATime] = useState(true);\n  const toothSequence = [...quadrants.upperRight.slice().reverse(), ...quadrants.upperLeft, ...quadrants.lowerLeft, ...quadrants.lowerRight.slice().reverse()];'
)

# Update conditions toggle
condition_replace = '''const handleConditionToggle = (
    toothId: number,
    condition: keyof PeriodontalConditions
  ) => {
    setRecords((prev) => {
      const recordIndex = prev.findIndex((r) => r.toothId === toothId);
      const record = recordIndex > -1 ? prev[recordIndex] : getRecord(toothId);
      const currentValue = record.conditions?.[condition] || false;
      const updatedRecord = {
        ...record,
        conditions: {
          ...record.conditions,
          [condition]: !currentValue,
        },
      };
      const newRecords = [...prev];
      if (recordIndex > -1) {
        newRecords[recordIndex] = updatedRecord;
      } else {
        newRecords.push(updatedRecord);
      }
      return newRecords;
    });
  };'''

content = re.sub(r'const handleConditionToggle.*?return newRecords;\n    \}\);\n  \};', condition_replace, content, flags=re.DOTALL)

# Add the modal UI
modal_ui = '''
      <Dialog open={selectedTooth !== undefined} onOpenChange={(open) => !open && setSelectedTooth(undefined)}>
        <DialogContent className="max-w-2xl bg-[#f5f8fa] p-0 overflow-hidden border-[#e0e6eb] gap-0">
          <DialogHeader className="bg-[#008B89] text-white p-3 flex flex-row justify-between items-center m-0 border-b border-[#007472]">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-teal-600 rounded" onClick={() => {
              if (!selectedTooth) return;
              const idx = toothSequence.indexOf(selectedTooth);
              if (idx > 0) setSelectedTooth(toothSequence[idx - 1]);
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
            <DialogTitle className="font-bold text-lg text-center m-0 flex items-center gap-4">
              <span>Tooth {selectedTooth}</span>
              <div className="flex items-center gap-2 text-sm font-normal bg-white/10 px-3 py-1 rounded-full">
                <input type="checkbox" checked={threeAtATime} onChange={(e) => setThreeAtATime(e.target.checked)} className="w-3 h-3 rounded border-white text-teal-600 focus:ring-teal-500" />
                <span>Auto-Advance</span>
              </div>
            </DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-teal-600 rounded" onClick={() => {
              if (!selectedTooth) return;
              const idx = toothSequence.indexOf(selectedTooth);
              if (idx < toothSequence.length - 1) setSelectedTooth(toothSequence[idx + 1]);
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Button>
          </DialogHeader>
          
          {selectedTooth && (
            <div className="flex flex-col p-4 bg-white">
              
              <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-3 mb-6 flex items-start gap-3">
                <div className="text-teal-600 font-bold mt-0.5 animate-bounce">💡</div>
                <div className="text-xs text-teal-800 leading-relaxed">
                  <strong className="font-extrabold text-teal-900 uppercase tracking-wider text-[10px] mr-1">Fast Charting:</strong> 
                  Simply type your measurements! The cursor automatically jumps from <strong className="font-semibold">Buccal</strong> to <strong className="font-semibold">Lingual</strong>. 
                  When <strong className="font-semibold">Auto-Advance</strong> is checked, finishing the Lingual side instantly jumps to the next tooth! No mouse required.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                {/* BUCCAL SIDE */}
                <div>
                  <h4 className="text-center font-bold text-slate-700 mb-3 border-b pb-1">Buccal / Facial</h4>
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center text-center">
                    <div></div>
                    <div className="text-xs font-bold text-slate-400">M</div>
                    <div className="text-xs font-bold text-slate-400">F</div>
                    <div className="text-xs font-bold text-slate-400">D</div>
                    
                    <span className="text-xs font-bold text-slate-500 text-right pr-2">PD</span>
                    {[
                      { pos: "mesiobuccal", val: getRecord(selectedTooth).pockets.mesiobuccal },
                      { pos: "buccal", val: getRecord(selectedTooth).pockets.buccal },
                      { pos: "distobuccal", val: getRecord(selectedTooth).pockets.distobuccal }
                    ].map((item, idx) => (
                      <Input key={`b-pd-${idx}`} id={`modal-b-pd-${idx}`}
                        className="h-9 text-center font-bold text-slate-800 border-2 focus-visible:border-teal-500"
                        value={item.val ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          handlePocketChange(selectedTooth, item.pos, val);
                          if (val.length >= 1) {
                            if (idx < 2) document.getElementById(`modal-b-pd-${idx + 1}`)?.focus();
                            else document.getElementById(`modal-l-pd-0`)?.focus();
                          }
                        }} 
                      />
                    ))}

                    <span className="text-xs font-bold text-slate-500 text-right pr-2">GM</span>
                    {[1, 2, 3].map((_, idx) => (
                      <Input key={`b-gm-${idx}`} id={`modal-b-gm-${idx}`}
                        className="h-9 text-center font-bold text-slate-800 border-2 focus-visible:border-teal-500"
                        value={getRecord(selectedTooth).recession ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          handleRecessionChange(selectedTooth, val);
                          if (val.length >= 1) {
                            if (idx < 2) document.getElementById(`modal-b-gm-${idx + 1}`)?.focus();
                            else document.getElementById(`modal-l-gm-0`)?.focus();
                          }
                        }} 
                      />
                    ))}

                    <span className="text-xs font-bold text-slate-500 text-right pr-2">CAL</span>
                    {[
                      (getRecord(selectedTooth).pockets.mesiobuccal || 0) + (getRecord(selectedTooth).recession || 0),
                      (getRecord(selectedTooth).pockets.buccal || 0) + (getRecord(selectedTooth).recession || 0),
                      (getRecord(selectedTooth).pockets.distobuccal || 0) + (getRecord(selectedTooth).recession || 0)
                    ].map((cal, idx) => (
                      <div key={`b-cal-${idx}`} className="h-9 bg-slate-50 flex items-center justify-center font-bold text-slate-400 rounded border border-slate-100">
                        {cal || "-"}
                      </div>
                    ))}
                  </div>
                </div>

                {/* LINGUAL SIDE */}
                <div>
                  <h4 className="text-center font-bold text-slate-700 mb-3 border-b pb-1">Lingual / Palatal</h4>
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center text-center">
                    <div></div>
                    <div className="text-xs font-bold text-slate-400">M</div>
                    <div className="text-xs font-bold text-slate-400">L</div>
                    <div className="text-xs font-bold text-slate-400">D</div>
                    
                    <span className="text-xs font-bold text-slate-500 text-right pr-2">PD</span>
                    {[
                      { pos: "mesiolingual", val: getRecord(selectedTooth).pockets.mesiolingual },
                      { pos: "lingual", val: getRecord(selectedTooth).pockets.lingual },
                      { pos: "distolingual", val: getRecord(selectedTooth).pockets.distolingual }
                    ].map((item, idx) => (
                      <Input key={`l-pd-${idx}`} id={`modal-l-pd-${idx}`}
                        className="h-9 text-center font-bold text-slate-800 border-2 focus-visible:border-teal-500"
                        value={item.val ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          handlePocketChange(selectedTooth, item.pos, val);
                          if (val.length >= 1) {
                            if (idx < 2) {
                              document.getElementById(`modal-l-pd-${idx + 1}`)?.focus();
                            } else if (threeAtATime) {
                              const seqIdx = toothSequence.indexOf(selectedTooth);
                              if (seqIdx < toothSequence.length - 1) {
                                setSelectedTooth(toothSequence[seqIdx + 1]);
                                setTimeout(() => document.getElementById('modal-b-pd-0')?.focus(), 50);
                              }
                            }
                          }
                        }} 
                      />
                    ))}

                    <span className="text-xs font-bold text-slate-500 text-right pr-2">GM</span>
                    {[1, 2, 3].map((_, idx) => (
                      <Input key={`l-gm-${idx}`} id={`modal-l-gm-${idx}`}
                        className="h-9 text-center font-bold text-slate-800 border-2 focus-visible:border-teal-500"
                        value={getRecord(selectedTooth).recession ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          handleRecessionChange(selectedTooth, val);
                          if (val.length >= 1) {
                            if (idx < 2) {
                              document.getElementById(`modal-l-gm-${idx + 1}`)?.focus();
                            } else if (threeAtATime) {
                              const seqIdx = toothSequence.indexOf(selectedTooth);
                              if (seqIdx < toothSequence.length - 1) {
                                setSelectedTooth(toothSequence[seqIdx + 1]);
                                setTimeout(() => document.getElementById('modal-b-gm-0')?.focus(), 50);
                              }
                            }
                          }
                        }} 
                      />
                    ))}

                    <span className="text-xs font-bold text-slate-500 text-right pr-2">CAL</span>
                    {[
                      (getRecord(selectedTooth).pockets.mesiolingual || 0) + (getRecord(selectedTooth).recession || 0),
                      (getRecord(selectedTooth).pockets.lingual || 0) + (getRecord(selectedTooth).recession || 0),
                      (getRecord(selectedTooth).pockets.distolingual || 0) + (getRecord(selectedTooth).recession || 0)
                    ].map((cal, idx) => (
                      <div key={`l-cal-${idx}`} className="h-9 bg-slate-50 flex items-center justify-center font-bold text-slate-400 rounded border border-slate-100">
                        {cal || "-"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100 mb-4"></div>

              {/* Conditions & Mobility */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 items-center justify-center">
                
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 mr-2">CONDITIONS:</span>
                  {[
                    { label: "Bleeding", key: "bleeding", color: "bg-red-100 text-red-600 border-red-200 hover:bg-red-200", active: "bg-red-500 text-white border-red-600" },
                    { label: "Suppuration", key: "suppuration", color: "bg-yellow-100 text-yellow-600 border-yellow-200 hover:bg-yellow-200", active: "bg-yellow-500 text-white border-yellow-600" },
                    { label: "Plaque", key: "plaque", color: "bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200", active: "bg-blue-500 text-white border-blue-600" },
                    { label: "Calculus", key: "calculus", color: "bg-green-100 text-green-600 border-green-200 hover:bg-green-200", active: "bg-green-500 text-white border-green-600" }
                  ].map(cond => {
                    const isActive = getRecord(selectedTooth).conditions[cond.key];
                    return (
                      <button 
                        key={cond.key}
                        onClick={() => handleConditionToggle(selectedTooth, cond.key)} 
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors", 
                          isActive ? cond.active : cond.color
                        )}
                      >
                        {cond.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 mr-2">MOBILITY:</span>
                  {["0", "1", "2", "3"].map(val => {
                    const isSelected = getRecord(selectedTooth).mobility === val || (val === "0" && !getRecord(selectedTooth).mobility);
                    return (
                      <button 
                        key={`mob-${val}`}
                        onClick={() => {
                          setRecords(prev => {
                            const newRecs = [...prev];
                            const idx = newRecs.findIndex(r => r.toothId === selectedTooth);
                            if (idx > -1) {
                              newRecs[idx] = { ...newRecs[idx], mobility: val === "0" ? "" : val };
                            } else {
                              newRecs.push({ ...getRecord(selectedTooth), mobility: val === "0" ? "" : val });
                            }
                            return newRecs;
                          });
                        }} 
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-colors", 
                          isSelected ? "bg-slate-700 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>

              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>'''
content = content.replace('</Card>', modal_ui + '\n    </Card>')

# Update handlePocketChange types
content = re.sub(
    r'handlePocketChange.*?const numericValue',
    'handlePocketChange = (\n    toothId: number,\n    position: string,\n    value: string\n  ) => {\n    const numericValue',
    content,
    flags=re.DOTALL
)

# Add Dialog import
if 'DialogContent' not in content:
    content = re.sub(r'import \{.*?from "@/components/ui/card";', lambda m: m.group(0) + '\nimport { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";', content, flags=re.DOTALL)

# Modify ToothColumn
tooth_column_replace = '''const ToothColumn = ({ toothId, arch, col }: { toothId: number; arch: "upper" | "lower", col: number }) => {
    const record = getRecord(toothId);
    const isMissing = dentalRecords.find(r => r.toothId === toothId && r.type === "missing");
    
    return (
      <g 
        className={cn("transition-opacity", isMissing && "opacity-40")}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (!isMissing && canUpdateChart) {
            setSelectedTooth(toothId);
          }
        }}
      >
        <rect x="-4" y="-4" width="44" height="420" className={cn("fill-transparent transition-colors", selectedTooth === toothId && "fill-blue-500/10")} />
        <text x="18" y="24" className="text-xs font-semibold fill-muted-foreground text-anchor-middle">{toothId}</text>
        
        {/* Realistic Transparent PNG Tooth Image representation */}
        <foreignObject x="0" y="32" width="36" height="36">
          <div 
            className={cn(
              "w-full h-full p-0.5 flex items-center justify-center rounded border relative transition-colors duration-200",
              isMissing ? "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700" :
              record.conditions?.bleeding ? "bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-800" :
              record.conditions?.suppuration ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-950/20 dark:border-yellow-800" :
              record.conditions?.plaque ? "bg-blue-50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-800" :
              record.conditions?.calculus ? "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800" :
              "bg-card border-border"
            )}
          >
            {!isMissing && (
              <img 
                src={`/periodontal/${toothId}.png`} 
                alt={`Tooth ${toothId}`}
                className="w-full h-full object-contain"
                style={{
                  filter: record.conditions?.bleeding ? "drop-shadow(0 0 2px rgba(239, 68, 68, 0.8))" : "none"
                }}
              />
            )}
            <div className="absolute bottom-0 right-1 text-[8px] font-bold opacity-75 pointer-events-none fill-foreground">
              {toothId}
            </div>
            {isMissing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-0.5 bg-red-500/50 rotate-45 absolute" />
                <div className="w-full h-0.5 bg-red-500/50 -rotate-45 absolute" />
              </div>
            )}
          </div>
        </foreignObject>

        <line x1="0" y1="32" x2="36" y2="32" stroke="hsl(var(--border))" />
        <line x1="0" y1="68" x2="36" y2="68" stroke="hsl(var(--border))" />
        <line x1="0" y1="80" x2="36" y2="80" stroke="hsl(var(--border))" />
        <line x1="0" y1="108" x2="36" y2="108" stroke="hsl(var(--border))" />
        <line x1="0" y1="136" x2="36" y2="136" stroke="hsl(var(--border))" />
        <line x1="0" y1="164" x2="36" y2="164" stroke="hsl(var(--border))" />
        <line x1="0" y1="184" x2="36" y2="184" stroke="hsl(var(--border))" />
        <line x1="0" y1="216" x2="36" y2="216" stroke="hsl(var(--border))" />
        <line x1="0" y1="220" x2="36" y2="220" stroke="hsl(var(--border))" />
        <line x1="0" y1="248" x2="36" y2="248" stroke="hsl(var(--border))" />
        <line x1="0" y1="276" x2="36" y2="276" stroke="hsl(var(--border))" />
        <line x1="0" y1="304" x2="36" y2="304" stroke="hsl(var(--border))" />
        <line x1="0" y1="336" x2="36" y2="336" stroke="hsl(var(--border))" />
        <line x1="0" y1="364" x2="36" y2="364" stroke="hsl(var(--border))" />
        <line x1="0" y1="392" x2="36" y2="392" stroke="hsl(var(--border))" />
      </g>
    );
  };'''

content = re.sub(r'const ToothColumn =.*?return \(.*?\);\n  \};', tooth_column_replace, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
