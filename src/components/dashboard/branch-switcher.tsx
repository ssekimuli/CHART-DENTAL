
"use client";

import { useBranch } from "@/context/branch-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currentUser } from "@/lib/user";
import { Building } from "lucide-react";

export function BranchSwitcher() {
  const { selectedBranch, setSelectedBranch, availableBranches } = useBranch();
  const branchName = availableBranches.find(b => b.id === selectedBranch)?.name || "Select Branch";

  if (currentUser.role !== 'Super Admin') {
    return <h1 className="text-lg font-semibold md:text-xl">{branchName}</h1>;
  }

  return (
    <div className="flex items-center gap-2">
      <Building className="h-5 w-5 text-muted-foreground" />
      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
        <SelectTrigger className="w-auto border-none bg-transparent shadow-none focus:ring-0">
          <SelectValue placeholder="Select Branch" />
        </SelectTrigger>
        <SelectContent>
          {availableBranches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
