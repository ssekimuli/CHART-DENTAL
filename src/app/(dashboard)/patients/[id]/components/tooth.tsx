
import React from "react";
import { cn } from "@/lib/utils";
import type { DentalCondition } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ToothProps = {
  toothId: number;
  condition: DentalCondition;
  hasTreatmentPlan: boolean;
  onClick: () => void;
};

const conditionColors: Record<DentalCondition, string> = {
  Healthy: "fill-white dark:fill-gray-300",
  Caries: "fill-yellow-400",
  Filling: "fill-blue-400",
  Crown: "fill-purple-400",
  Missing: "fill-gray-500 opacity-50",
  Fracture: "fill-red-500",
};

export function Tooth({ toothId, condition, hasTreatmentPlan, onClick }: ToothProps) {
  const isUpper = toothId < 30;
  const isMolnar = [4, 5, 6, 7, 8].includes(toothId % 10);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={onClick}
            className="group cursor-pointer text-center"
          >
            <svg
              viewBox="0 0 40 60"
              className={cn(
                "h-16 w-8 transition-transform duration-200 group-hover:scale-110",
                !isUpper && "transform rotate-180"
              )}
            >
              <path
                d={
                  isMolnar
                    ? "M5 5 Q20 -5 35 5 L30 30 Q20 40 10 30 Z" // Molar shape
                    : "M10 5 Q20 -5 30 5 L25 30 Q20 35 15 30 Z" // Incisor shape
                }
                className={cn(
                  "stroke-gray-600 dark:stroke-gray-400 stroke-2",
                  conditionColors[condition],
                   hasTreatmentPlan && "stroke-blue-500 !stroke-[3px]"
                )}
              />
              {condition === "Fracture" && (
                 <path d="M10 15 L30 20" className="stroke-red-700 stroke-2" />
              )}
            </svg>
            <span className="text-xs text-muted-foreground">{toothId}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tooth #{toothId}</p>
          <p>Condition: {condition}</p>
          {hasTreatmentPlan && <p className="text-blue-500">Treatment Planned</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
