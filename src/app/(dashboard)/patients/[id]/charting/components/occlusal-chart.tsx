
"use client";

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
import { useState } from "react";
import { Pencil } from "lucide-react";
import { hasPermission } from "@/lib/user";

type OcclusalChartProps = {
  initialRecord: OcclusalRecord;
  onSave: (record: OcclusalRecord) => void;
};

export function OcclusalChart({ initialRecord, onSave }: OcclusalChartProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [record, setRecord] = useState<OcclusalRecord>(initialRecord);
  const canUpdateChart = hasPermission('charting:update');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRecord({
      ...record,
      [name]: value === "" ? "" : parseInt(value, 10),
    });
  };

  const handleSelectChange = (name: keyof OcclusalRecord, value: string) => {
    setRecord({
      ...record,
      [name]: value,
    });
  };

  const handleSave = () => {
    const numericRecord: OcclusalRecord = {
        ...record,
        overjet: record.overjet === '' ? 0 : Number(record.overjet),
        overbite: record.overbite === '' ? 0 : Number(record.overbite),
    }
    onSave(numericRecord);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setRecord(initialRecord);
    setIsEditing(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Occlusal Chart</CardTitle>
            <CardDescription>
            {isEditing
                ? "Update the bite relationship between upper and lower jaws."
                : "Bite relationship between upper and lower jaws."}
            </CardDescription>
        </div>
        {!isEditing && canUpdateChart && (
            <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Chart</span>
            </Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isEditing ? (
          <>
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
          </>
        ) : (
          <>
            <div className="space-y-1 rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Overjet</p>
              <p className="text-lg font-medium">{initialRecord.overjet} mm</p>
            </div>
            <div className="space-y-1 rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Overbite</p>
              <p className="text-lg font-medium">{initialRecord.overbite} mm</p>
            </div>
            <div className="space-y-1 rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Malocclusion</p>
              <p className="text-lg font-medium">{initialRecord.malocclusion}</p>
            </div>
            <div className="space-y-1 rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Crossbite</p>
              <p className="text-lg font-medium">{initialRecord.crossbite}</p>
            </div>
            <div className="space-y-1 rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Open Bite</p>
              <p className="text-lg font-medium">{initialRecord.openbite}</p>
            </div>
          </>
        )}
      </CardContent>
      {isEditing && (
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardFooter>
      )}
    </Card>
  );
}
