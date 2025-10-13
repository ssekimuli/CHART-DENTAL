
"use client";

import { useBranch } from "@/context/branch-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentUser } from "@/lib/user";
import { Building } from "lucide-react";

export function BranchSwitcher() {
  const { selectedBranch, setSelectedBranch, availableBranches } = useBranch();
  const currentUser = getCurrentUser();
  const branchName = availableBranches.find(b => b.id === selectedBranch)?.name || currentUser?.branchName || "Select Branch";

  if (!currentUser || !currentUser.permissions.includes('branches:read')) {
    return <h1 className="text-lg font-semibold md:text-xl">{branchName}</h1>;
  }

  return (
    <div className="flex items-center gap-2">
      <Building className="h-5 w-5 text-muted-foreground" />
      <Select value={String(selectedBranch)} onValueChange={setSelectedBranch}>
        <SelectTrigger className="w-auto border-none bg-transparent shadow-none focus:ring-0">
          <SelectValue placeholder="Select Branch" />
        </SelectTrigger>
        <SelectContent>
          {availableBranches.map((branch) => (
            <SelectItem key={branch.id} value={String(branch.id)}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
