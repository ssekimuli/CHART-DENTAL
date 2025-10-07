
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OcclusalRecord } from "@/lib/types";

type OcclusalChartProps = {
  initialRecord: OcclusalRecord;
  onSave: (record: OcclusalRecord) => void;
};

export function OcclusalChart({ initialRecord, onSave }: OcclusalChartProps) {
  const [record, setRecord] = useState<OcclusalRecord>(initialRecord);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRecord((prev) => ({
      ...prev,
      [name]: value === "" ? 0 : parseInt(value, 10),
    }));
  };

  const handleSelectChange = (name: keyof OcclusalRecord, value: string) => {
    setRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occlusal Chart</CardTitle>
        <CardDescription>
          Record bite relationship between upper and lower jaws.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="overjet">Overjet (mm)</Label>
          <Input
            id="overjet"
            name="overjet"
            type="number"
            value={record.overjet}
            onChange={handleInputChange}
            placeholder="e.g., 2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="overbite">Overbite (mm)</Label>
          <Input
            id="overbite"
            name="overbite"
            type="number"
            value={record.overbite}
            onChange={handleInputChange}
            placeholder="e.g., 2"
          />
        </div>
        <div className="space-y-2">
            <Label htmlFor="malocclusion">Malocclusion</Label>
            <Select
                value={record.malocclusion}
                onValueChange={(value) => handleSelectChange("malocclusion", value)}
            >
                <SelectTrigger id="malocclusion">
                    <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Class I">Class I (Normal)</SelectItem>
                    <SelectItem value="Class II">Class II (Distocclusion)</SelectItem>
                    <SelectItem value="Class III">Class III (Mesiocclusion)</SelectItem>
                </SelectContent>
            </Select>
        </div>
         <div className="space-y-2">
            <Label htmlFor="crossbite">Crossbite</Label>
            <Select
                value={record.crossbite}
                onValueChange={(value) => handleSelectChange("crossbite", value)}
            >
                <SelectTrigger id="crossbite">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Anterior">Anterior</SelectItem>
                    <SelectItem value="Posterior">Posterior</SelectItem>
                </SelectContent>
            </Select>
        </div>
         <div className="space-y-2">
            <Label htmlFor="openbite">Open Bite</Label>
            <Select
                value={record.openbite}
                onValueChange={(value) => handleSelectChange("openbite", value)}
            >
                <SelectTrigger id="openbite">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Anterior">Anterior</SelectItem>
                    <SelectItem value="Posterior">Posterior</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSave(record)}>Save Chart</Button>
      </CardFooter>
    </Card>
  );
}
