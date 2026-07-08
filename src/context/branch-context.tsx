
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Branch } from '@/lib/types';
import { getBranches } from '@/lib/api';
import { getCurrentUser } from '@/lib/user';
import { setCurrencyCode } from '@/lib/currency';

interface BranchContextType {
  selectedBranch: number | string;
  setSelectedBranch: (branchId: number | string) => void;
  availableBranches: Branch[];
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<number | string>('');
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
        const branches = await getBranches();
        setAvailableBranches(branches);

        // Get the current user's branch
        const currentUser = getCurrentUser();

        if (currentUser?.branchId) {
            // Use the user's assigned branch (convert to number if it's a valid number)
            const userBranchId = currentUser.branchId;
            const branchIdAsNumber = typeof userBranchId === 'string' ? parseInt(userBranchId, 10) : userBranchId;
            setSelectedBranch(isNaN(branchIdAsNumber) ? userBranchId : branchIdAsNumber);
        } else if (branches.length > 0) {
            // Fallback to first branch if no user branch is set
            setSelectedBranch(branches[0].id);
        }
    }
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch && availableBranches.length > 0) {
      const activeBranch = availableBranches.find(b => String(b.id) === String(selectedBranch));
      if (activeBranch && activeBranch.currency) {
        setCurrencyCode(activeBranch.currency);
      }
    }
  }, [selectedBranch, availableBranches]);

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
