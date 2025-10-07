
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Branch } from '@/lib/types';
import { branches } from '@/lib/data';

interface BranchContextType {
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  availableBranches: Branch[];
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<string>('b1'); // Default to the first branch

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, availableBranches: branches }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
