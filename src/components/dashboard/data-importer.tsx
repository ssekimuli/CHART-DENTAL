"use client";

import React, { useState, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
    parseImportFile, 
    startImport, 
    downloadTemplate, 
    listTemplates, 
    TemplateInfo, 
    ImportStartResponse 
} from "@/lib/api";
import { 
    Upload, 
    Download, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Loader2, 
    FileSpreadsheet, 
    HelpCircle 
} from "lucide-react";

import * as XLSX from "xlsx";

interface DataImporterProps {
    type: "patients" | "employees" | "treatments";
    triggerText: string;
    onImportSuccess?: () => void;
}

export function DataImporter({ type, triggerText, onImportSuccess }: DataImporterProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // Step 1: Upload states
    const [file, setFile] = useState<File | null>(null);
    const [templates, setTemplates] = useState<TemplateInfo[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    
    // Step 2: Mapping states
    const [filePath, setFilePath] = useState("");
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);

    // Step 3: Result states
    const [result, setResult] = useState<ImportStartResponse | null>(null);

    // Load templates
    useEffect(() => {
        const loadTemplates = async () => {
            const list = await listTemplates();
            setTemplates(list.filter(t => t.type === type));
        };
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen, type]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDownloadTemplate = async (filename: string) => {
        setIsDownloading(filename);
        try {
            await downloadTemplate(filename);
            toast({
                title: "Template Downloaded",
                description: `Successfully downloaded ${filename}`,
            });
        } catch (error) {
            toast({
                title: "Download Failed",
                description: "Failed to download the template file.",
                variant: "destructive",
            });
        } finally {
            setIsDownloading(null);
        }
    };

    const handleUploadAndParse = async () => {
        if (!file) return;
        setIsParsing(true);
        try {
            let fileToParse = file;
            const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
            
            if (isExcel) {
                toast({
                    title: "Excel File Detected",
                    description: "Converting worksheet to CSV format in browser...",
                });
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                
                fileToParse = new File(
                    [csv], 
                    file.name.replace(/\.xlsx?$/, ".csv"), 
                    { type: "text/csv" }
                );
            }

            const data = await parseImportFile(fileToParse, type);
            setFilePath(data.file_path);
            setCsvHeaders(data.headers);
            setAvailableColumns(data.available_columns);
            
            // Auto-map columns based on name similarity
            const initialMapping: Record<string, string> = {};
            data.available_columns.forEach(col => {
                // Look for direct match or variations (e.g. date_of_birth -> Date of Birth or DOB)
                const cleanCol = col.toLowerCase().replace(/_/g, "");
                const matchedHeader = data.headers.find(header => {
                    const cleanHeader = header.toLowerCase().replace(/[\s_-]/g, "");
                    return cleanHeader === cleanCol || 
                           cleanHeader.includes(cleanCol) || 
                           cleanCol.includes(cleanHeader);
                });
                initialMapping[col] = matchedHeader || "";
            });
            setMapping(initialMapping);
            setStep(2);
        } catch (error: any) {
            toast({
                title: "Parsing Failed",
                description: error.response?.data?.error || "Failed to process the CSV file headers. Ensure it is a valid CSV.",
                variant: "destructive",
            });
        } finally {
            setIsParsing(false);
        }
    };

    const handleMappingChange = (dbCol: string, csvHeader: string) => {
        setMapping(prev => ({
            ...prev,
            [dbCol]: csvHeader
        }));
    };

    const handleStartImport = async () => {
        // Validate required fields
        const requiredFields = type === "treatments" ? ["procedure"] : ["email"];
        const missingFields = requiredFields.filter(f => !mapping[f]);
        
        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Mapping",
                description: `Please map the required field(s): ${missingFields.join(", ")}`,
                variant: "destructive",
            });
            return;
        }

        setIsImporting(true);
        try {
            const res = await startImport(filePath, type, mapping);
            setResult(res);
            setStep(3);
            if (onImportSuccess) {
                onImportSuccess();
            }
        } catch (error: any) {
            toast({
                title: "Import Failed",
                description: error.response?.data?.error || "Failed to import datasets.",
                variant: "destructive",
            });
        } finally {
            setIsImporting(false);
        }
    };

    const resetImporter = () => {
        setFile(null);
        setStep(1);
        setFilePath("");
        setCsvHeaders([]);
        setAvailableColumns([]);
        setMapping({});
        setResult(null);
    };

    const getFieldLabel = (field: string) => {
        return field
            .split("_")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetImporter();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="capitalize">Import {type}</DialogTitle>
                    <DialogDescription>
                        Import bulk records via CSV file upload. Follow the steps below.
                    </DialogDescription>
                </DialogHeader>

                {/* STEP 1: Upload File */}
                {step === 1 && (
                    <div className="space-y-6 py-4">
                        {/* Templates Download */}
                        {templates.length > 0 && (
                            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-foreground">
                                    <Download className="h-4 w-4 text-primary" />
                                    1. Download Import Template
                                </h4>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Use these prepared templates to structure your import data correctly before uploading.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {templates.map((tpl) => (
                                        <Button
                                            key={tpl.name}
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleDownloadTemplate(tpl.name)}
                                            disabled={isDownloading === tpl.name}
                                            className="text-xs gap-1.5"
                                        >
                                            {isDownloading === tpl.name ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                            )}
                                            {tpl.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* File Selector */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <Upload className="h-4 w-4 text-primary" />
                                2. Upload CSV or Excel File
                            </Label>
                            <div className="border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center bg-background/50 text-center">
                                <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                                <div className="text-sm text-foreground mb-1">
                                    <span className="font-semibold text-primary cursor-pointer hover:underline">
                                        Click to upload
                                    </span>{" "}
                                    or drag and drop
                                </div>
                                <div className="text-xs text-muted-foreground">CSV or Excel files up to 200MB</div>
                                <input
                                    type="file"
                                    accept=".csv,.txt,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="csv-file-upload"
                                />
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-4"
                                    onClick={() => document.getElementById("csv-file-upload")?.click()}
                                >
                                    Select File
                                </Button>
                            </div>
                            
                            {file && (
                                <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-600">
                                    <span className="truncate font-medium">{file.name}</span>
                                    <span className="text-xs shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button 
                                onClick={handleUploadAndParse} 
                                disabled={!file || isParsing} 
                                className="w-full sm:w-auto gap-1.5"
                            >
                                {isParsing && <Loader2 className="h-4 w-4 animate-spin" />}
                                Continue to Mapping
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* STEP 2: Column Mapping */}
                {step === 2 && (
                    <div className="space-y-5 py-4">
                        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-xs text-primary flex items-start gap-2">
                            <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                                <strong>Dynamic Mapping:</strong> Link each database column on the left to its corresponding column in your uploaded CSV file on the right. Required fields are marked with <span className="text-rose-500">*</span>.
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                            <div className="grid grid-cols-2 text-xs font-semibold text-muted-foreground pb-2 border-b border-border/40">
                                <div>System Database Column</div>
                                <div>CSV Header Mapping</div>
                            </div>
                            
                            {availableColumns.map((col) => {
                                const isRequired = type === "treatments" ? col === "procedure" : col === "email";
                                return (
                                    <div key={col} className="grid grid-cols-2 items-center gap-4 py-1 text-sm">
                                        <Label htmlFor={`col-${col}`} className="font-medium text-foreground flex items-center gap-1">
                                            {getFieldLabel(col)}
                                            {isRequired && <span className="text-rose-500">*</span>}
                                        </Label>
                                        <select
                                            id={`col-${col}`}
                                            value={mapping[col] || ""}
                                            onChange={(e) => handleMappingChange(col, e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">[ Skip Column ]</option>
                                            {csvHeaders.map(header => (
                                                <option key={header} value={header}>{header}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>

                        <DialogFooter className="flex-row justify-between pt-2">
                            <Button variant="ghost" onClick={() => setStep(1)} disabled={isImporting}>
                                Back
                            </Button>
                            <Button 
                                onClick={handleStartImport} 
                                disabled={isImporting} 
                                className="gap-1.5"
                            >
                                {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Start Import Process
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* STEP 3: Results */}
                {step === 3 && result && (
                    <div className="space-y-6 py-6 text-center">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-foreground">Import Completed Successfully!</h3>
                            <p className="text-sm text-muted-foreground px-4">
                                {result.message}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-sm py-4 border-y border-border/40">
                            <div className="text-left space-y-1">
                                <span className="text-xs text-muted-foreground">Rows Processed</span>
                                <div className="font-bold text-foreground">{result.processed_rows.toLocaleString()}</div>
                            </div>
                            <div className="text-left space-y-1">
                                <span className="text-xs text-muted-foreground">Duration</span>
                                <div className="font-bold text-foreground">{result.duration_seconds} seconds</div>
                            </div>
                            <div className="text-left space-y-1 col-span-2">
                                <span className="text-xs text-muted-foreground">Import Engine</span>
                                <div className="font-semibold text-foreground">{result.method_used}</div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button className="w-full" onClick={() => setIsOpen(false)}>
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
