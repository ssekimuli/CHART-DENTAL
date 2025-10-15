
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Branch } from '@/lib/types';
import { getBranches } from '@/lib/api';
import { getCurrentUser } from '@/lib/user';

interface BranchContextType {
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  availableBranches: Branch[];
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const initializeBranchData = async () => {
      const user = getCurrentUser();
      if (!user) return;

      // Set the default selected branch from the user's profile
      setSelectedBranch(String(user.branchId));

      if (user.role === 'Super Admin') {
        // Super Admins can see and switch between all branches
        const allBranches = await getBranches();
        setAvailableBranches(allBranches);
      } else {
        // Other users only see their own branch
        setAvailableBranches([{ 
            id: user.branchId, 
            name: user.branchName, 
            address: '' // Address is not needed for the switcher
        }]);
      }
    };
    initializeBranchData();
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
