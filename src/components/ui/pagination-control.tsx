"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export function PaginationControl({
  currentPage,
  lastPage,
  onPageChange,
}: PaginationControlProps) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <div className="text-sm font-medium text-muted-foreground min-w-[100px] text-center">
        Page {currentPage} of {lastPage}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
