
"use client";

import React, { useState, useMemo } from "react";
import type { DentalRecord, DentalCondition, Treatment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilePen, Plus, Heart, AlertCircle, Droplets, Crown, Trash2, AlertTriangle, Zap, Link2, RotateCcw, Shuffle, CheckSquare, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";


const upperRightQuadrant = [18, 17, 16, 15, 14, 13, 12, 11];
const upperLeftQuadrant = [21, 22, 23, 24, 25, 26, 27, 28];
const lowerLeftQuadrant = [31, 32, 33, 34, 35, 36, 37, 38];
const lowerRightQuadrant = [48, 47, 46, 45, 44, 43, 42, 41];

const conditionInfo: { condition: DentalCondition; color: string; twColor: string; icon: React.ReactNode; description: string }[] = [
    { condition: 'Healthy', color: 'transparent', twColor: 'bg-transparent border border-gray-400 border-dashed', icon: <Heart size={16} />, description: 'Healthy tooth' },
    { condition: 'Caries', color: '#EA580C', twColor: 'bg-orange-600', icon: <AlertCircle size={16} />, description: 'Tooth decay/cavity' },
    { condition: 'Filling', color: '#0284C7', twColor: 'bg-sky-600', icon: <Droplets size={16} />, description: 'Filled restoration' },
    { condition: 'Crown', color: '#9333EA', twColor: 'bg-purple-600', icon: <Crown size={16} />, description: 'Crown restoration' },
    { condition: 'Missing', color: '#334155', twColor: 'bg-slate-700', icon: <Trash2 size={16} />, description: 'Missing tooth' },
    { condition: 'Fracture', color: '#DC2626', twColor: 'bg-red-600', icon: <AlertTriangle size={16} />, description: 'Broken tooth' },
    { condition: 'Implant', color: '#9CA3AF', twColor: 'bg-gray-400', icon: <Zap size={16} />, description: 'Dental implant' },
    { condition: 'Bridge', color: '#F59E0B', twColor: 'bg-amber-500', icon: <Link2 size={16} />, description: 'Bridge prosthetic' },
    { condition: 'Retained Root', color: '#22D3EE', twColor: 'bg-cyan-400', icon: <RotateCcw size={16} />, description: 'Retained root' },
    { condition: 'Malocclusion', color: '#D946EF', twColor: 'bg-fuchsia-500', icon: <Shuffle size={16} />, description: 'Malocclusion' },
    { condition: 'Generalized Calculus', color: '#92400E', twColor: 'bg-amber-800', icon: <AlertCircle size={16} />, description: 'Generalized calculus build-up' },
];

type DentalChartProps = {
  initialRecords: DentalRecord[];
  treatmentPlans: Treatment[];
  restorativeRecords?: RestorativeRecord[];
  onAddTreatment: (toothId: number) => void;
  onLogCondition: (toothId: number, toothIds?: number[]) => void;
  onQuickLogCondition?: (toothId: number, condition: DentalCondition) => void;
  onBatchLogCondition?: (toothIds: number[], condition: DentalCondition, notes?: string) => Promise<void> | void;
  onAddRestorativeRecord?: (toothId: number, surface?: string) => void;
  onConfirmBridge?: (toothIds: number[], bridgeGroupId: string) => void;
};

import { Odontogram } from "../charting/components/odontogram";
import type { RestorativeRecord } from "@/lib/types";

export function DentalChart({
  initialRecords,
  treatmentPlans,
  restorativeRecords = [],
  onAddTreatment,
  onLogCondition,
  onQuickLogCondition,
  onBatchLogCondition,
  onAddRestorativeRecord,
  onConfirmBridge
}: DentalChartProps) {
  const [selectedToothData, setSelectedToothData] = useState<{id: number, surface?: string} | null>(null);
  const [bridgeTeethSelection, setBridgeTeethSelection] = useState<number[]>([]);
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [isApplyingCondition, setIsApplyingCondition] = useState(false);

  const selectedTooth = selectedToothData?.id || null;

  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  const allTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48];

  const toggleToothSelection = (toothId: number) => {
    setSelectedTeeth((prev) =>
      prev.includes(toothId) ? prev.filter((id) => id !== toothId) : [...prev, toothId].sort((a, b) => a - b)
    );
  };

  const selectUpperArch = () => {
    setSelectedTeeth((prev) => Array.from(new Set([...prev, ...upperTeeth])).sort((a, b) => a - b));
  };

  const selectLowerArch = () => {
    setSelectedTeeth((prev) => Array.from(new Set([...prev, ...lowerTeeth])).sort((a, b) => a - b));
  };

  const selectAllTeeth = () => {
    setSelectedTeeth([...allTeeth].sort((a, b) => a - b));
  };

  const clearSelection = () => {
    setSelectedTeeth([]);
  };

  const handleToothClick = (toothId: number, surface?: string, event?: React.MouseEvent) => {
    if (isMultiSelectMode || event?.ctrlKey || event?.metaKey || event?.shiftKey) {
      if (!isMultiSelectMode) {
        setIsMultiSelectMode(true);
      }
      toggleToothSelection(toothId);
      return;
    }

    if (selectedTeeth.length > 0 && isMultiSelectMode) {
      toggleToothSelection(toothId);
      return;
    }

    setSelectedToothData({ id: toothId, surface });
  };

  const handleBatchApplyCondition = async (condition: DentalCondition) => {
    if (selectedTeeth.length === 0 || !onBatchLogCondition) return;
    setIsApplyingCondition(true);
    try {
      await onBatchLogCondition(selectedTeeth, condition, '');
      setSelectedTeeth([]);
    } finally {
      setIsApplyingCondition(false);
    }
  };

  // Keyboard shortcuts for condition selection
  React.useEffect(() => {
    if (!selectedTooth) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = parseInt(e.key);
      const nonBridgeConditions = conditionInfo.filter(c => c.condition !== 'Bridge');
      if (key >= 1 && key <= nonBridgeConditions.length) {
        e.preventDefault();
        const selectedCondition = nonBridgeConditions[key - 1];
        if (selectedCondition) {
          if (onQuickLogCondition) onQuickLogCondition(selectedTooth, selectedCondition.condition);
          setSelectedToothData(null);
        }
      }
      // Bridge shortcut
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setBridgeTeethSelection([selectedTooth]);
        setShowBridgeModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedTooth, onQuickLogCondition]);

  const toggleBridgeTooth = (toothId: number) => {
    if (bridgeTeethSelection.includes(toothId)) {
      setBridgeTeethSelection(bridgeTeethSelection.filter(id => id !== toothId));
    } else {
      setBridgeTeethSelection([...bridgeTeethSelection, toothId].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Legend & Multi-Select Controls */}
      <div className="flex flex-col gap-3 bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={isMultiSelectMode ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-1.5 transition-all text-xs font-semibold h-8",
                isMultiSelectMode ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40" : "hover:bg-slate-800"
              )}
              onClick={() => {
                const nextState = !isMultiSelectMode;
                setIsMultiSelectMode(nextState);
                if (!nextState) {
                  setSelectedTeeth([]);
                }
              }}
            >
              <CheckSquare className="h-4 w-4" />
              {isMultiSelectMode ? "Multi-Select Active" : "Multi-Select Mode"}
              {selectedTeeth.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-white/20 text-white hover:bg-white/20 text-[10px] px-1.5 py-0">
                  {selectedTeeth.length}
                </Badge>
              )}
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isMultiSelectMode ? "Click teeth to toggle selection, then pick a condition below" : "Tip: Hold Ctrl/Cmd to multi-select anytime"}
            </span>
          </div>

          {isMultiSelectMode && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={selectUpperArch}>
                Upper Arch (18-28)
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={selectLowerArch}>
                Lower Arch (48-38)
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={selectAllTeeth}>
                Select All
              </Button>
              {selectedTeeth.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-destructive hover:text-destructive" onClick={clearSelection}>
                  Clear ({selectedTeeth.length})
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 group cursor-help" title="Treatment planned procedures">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-transparent"></div>
              <span className="text-xs text-muted-foreground">Treatment Plan</span>
          </div>
          {conditionInfo.map(({ condition, twColor, icon, description }) => (
            <div key={condition} className="flex items-center gap-1.5 group cursor-help hover:bg-slate-800/50 px-1.5 py-0.5 rounded transition-colors" title={description}>
              <div className={cn('h-3 w-3 rounded-full border', twColor, {'border-gray-400': condition === 'Healthy'})}></div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {icon}
                {condition}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Odontogram Display */}
      <div className="rounded-lg bg-muted/10 p-6 border overflow-x-auto flex justify-center items-center min-h-[450px] relative">
        <div className="w-full scale-100 origin-center py-4 flex flex-col relative">
          <Odontogram
            records={restorativeRecords}
            dentalRecords={initialRecords}
            treatmentPlans={treatmentPlans}
            selectedTeeth={selectedTeeth}
            onToothClick={handleToothClick}
          />
        </div>
      </div>

      {/* Floating / Sticky Batch Condition Bar */}
      {selectedTeeth.length > 0 && (
        <div className="sticky bottom-4 z-40 bg-slate-900/95 backdrop-blur border border-primary/40 rounded-xl p-3.5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-semibold px-2 py-0.5 text-xs">
                {selectedTeeth.length} {selectedTeeth.length === 1 ? 'Tooth' : 'Teeth'} Selected
              </Badge>
              <span className="text-xs text-slate-300 font-mono hidden sm:inline max-w-[220px] truncate" title={selectedTeeth.join(', ')}>
                #{selectedTeeth.join(', #')}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-white"
              onClick={clearSelection}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center w-full lg:w-auto">
            <span className="text-xs text-slate-400 mr-1 hidden xl:inline font-medium">Set Condition:</span>
            {conditionInfo.filter(c => c.condition !== 'Bridge').map(({ condition, twColor }) => (
              <Button
                key={condition}
                variant="outline"
                size="sm"
                disabled={isApplyingCondition}
                className="h-8 px-2.5 text-xs gap-1.5 bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white transition-all shadow-sm"
                onClick={() => handleBatchApplyCondition(condition)}
              >
                <div className={cn('h-2.5 w-2.5 rounded-full border', twColor, {'border-gray-400': condition === 'Healthy'})} />
                <span>{condition}</span>
              </Button>
            ))}

            <Button
              variant="secondary"
              size="sm"
              disabled={isApplyingCondition}
              className="h-8 px-2.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium ml-1"
              onClick={() => {
                if (onLogCondition) {
                  onLogCondition(selectedTeeth[0], selectedTeeth);
                }
              }}
            >
              <FilePen className="h-3.5 w-3.5" />
              <span>With Notes...</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              disabled={isApplyingCondition}
              className="h-8 px-2.5 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium ml-1 shadow-sm"
              onClick={() => {
                if (selectedTeeth.length > 0 && onAddTreatment) {
                  onAddTreatment(selectedTeeth[0]);
                }
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Treatment</span>
            </Button>
          </div>
        </div>
      )}

      <Sheet open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedToothData(null)}>
        <SheetContent side="right" className="sm:max-w-md w-full overflow-hidden flex flex-col p-4 sm:p-6">
            <SheetHeader className="mb-4 shrink-0">
                <SheetTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {selectedTooth}
                    </span>
                    Tooth #{selectedTooth}
                </SheetTitle>
                <SheetDescription>
                    Quickly log a condition, treatment, or restorative procedure for this tooth.
                    {selectedToothData?.surface && <span className="block mt-1 font-medium text-primary">Selected View: {selectedToothData.surface}</span>}
                </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2">
              <div>
                <h4 className="text-xs sm:text-sm font-medium mb-2">Select Condition</h4>
                <p className="text-xs text-muted-foreground mb-2">Click or press 1-9</p>
              </div>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  {conditionInfo.map(({ condition, twColor, icon, description }, idx) => (
                     <Button
                          key={condition}
                          variant="outline"
                          size="sm"
                          className={cn("justify-start h-auto py-1.5 sm:py-2 flex-col items-start text-xs sm:text-sm", condition === 'Bridge' && 'opacity-50')}
                          onClick={() => {
                              if (condition !== 'Bridge') {
                                if (selectedTooth && onQuickLogCondition) onQuickLogCondition(selectedTooth, condition);
                                setSelectedToothData(null);
                              }
                          }}
                          disabled={condition === 'Bridge'}
                          title={`${description} (Press ${idx + 1})`}
                      >
                          <div className="flex items-center gap-1.5 w-full">
                            <div className={cn('h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border', twColor, {'border-gray-400': condition === 'Healthy'})}></div>
                            <span className="flex-1 text-left text-xs">{condition}</span>
                            <span className="text-xs text-muted-foreground hidden sm:inline">{icon}</span>
                          </div>
                          <span className="text-xs text-muted-foreground mt-0.5 w-full text-left line-clamp-1">{description}</span>
                      </Button>
                  ))}
              </div>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => {
                    setBridgeTeethSelection([selectedTooth!]);
                    setShowBridgeModal(true);
                  }}
                  title="Press B to quickly mark as bridge"
                >
                  🌉 Bridge
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm h-8"
                  onClick={() => {
                    if (selectedTooth) {
                      setIsMultiSelectMode(true);
                      setSelectedTeeth([selectedTooth]);
                      setSelectedToothData(null);
                    }
                  }}
                >
                  <CheckSquare className="mr-1 h-3.5 w-3.5" /> Select Multiple Teeth
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs sm:text-sm h-8"
                    onClick={() => {
                        if (selectedTooth) onLogCondition(selectedTooth);
                        setSelectedToothData(null);
                    }}
                >
                    <FilePen className="mr-1 h-3 w-3" /> Note
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs sm:text-sm h-8"
                  onClick={() => {
                      if (selectedTooth && onAddRestorativeRecord) onAddRestorativeRecord(selectedTooth, selectedToothData?.surface);
                      setSelectedToothData(null);
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Restoration
                </Button>
                <Button
                  size="sm"
                  className="w-full text-xs sm:text-sm h-8"
                  onClick={() => {
                      if (selectedTooth) onAddTreatment(selectedTooth);
                      setSelectedToothData(null);
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Treatment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm h-8"
                  onClick={() => {
                      window.location.href = `/patients/${window.location.pathname.split('/')[2]}/charting/tooth/${selectedTooth}`;
                  }}
                >
                  <FilePen className="mr-1 h-3 w-3" /> History
                </Button>
              </div>

              <div className="bg-slate-900/50 p-2 rounded text-xs shrink-0">
                <h4 className="font-semibold mb-1 text-slate-400">⌨️ Shortcuts</h4>
                <div className="text-muted-foreground space-y-0.5 text-xs">
                  <div className="flex justify-between"><span>1-9</span><span>Condition</span></div>
                  <div className="flex justify-between"><span>B</span><span>Bridge</span></div>
                </div>
              </div>
            </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showBridgeModal} onOpenChange={setShowBridgeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Bridge Teeth</DialogTitle>
            <DialogDescription>
              Tooth #{selectedTooth} + Select other teeth for this bridge
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded">
              <p className="text-sm font-medium mb-2">Selected Teeth</p>
              <p className="text-lg font-semibold text-fuchsia-600">
                {selectedTooth} {bridgeTeethSelection.length > 0 && `+ ${bridgeTeethSelection.join(', ')}`}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Select Other Teeth</p>
              <div className="grid grid-cols-4 gap-2 max-h-[250px] overflow-y-auto p-3 border rounded bg-slate-50 dark:bg-slate-950">
                {allTeeth.filter(tooth => tooth !== selectedTooth).map(tooth => (
                  <label
                    key={tooth}
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-sm font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={bridgeTeethSelection.includes(tooth)}
                      onChange={() => toggleBridgeTooth(tooth)}
                      className="w-4 h-4"
                    />
                    <span>{tooth}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setBridgeTeethSelection([]);
                  setShowBridgeModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                disabled={bridgeTeethSelection.length === 0}
                onClick={() => {
                  if (!selectedTooth) return;
                  const allBridgeTeeth = [selectedTooth, ...bridgeTeethSelection].sort((a, b) => a - b);
                  const bridgeGroupId = `bridge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  if (onConfirmBridge) {
                    onConfirmBridge(allBridgeTeeth, bridgeGroupId);
                  }
                  setBridgeTeethSelection([]);
                  setShowBridgeModal(false);
                  setSelectedToothData(null);
                }}
              >
                ✓ Save Bridge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
