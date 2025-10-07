
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Branch } from '@/lib/types';
import { getBranches } from '@/lib/api';

interface BranchContextType {
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  availableBranches: Branch[];
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<string>('b1'); // Default to the first branch
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
        const branches = await getBranches();
        setAvailableBranches(branches);
        if (branches.length > 0) {
            setSelectedBranch(branches[0].id);
        }
    }
    fetchBranches();
  }, []);

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, availableBranches }}>
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
