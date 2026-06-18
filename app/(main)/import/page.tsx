"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Upload,
    FileText,
    FileSpreadsheet,
    Loader2,
    CheckCircle2,
    XCircle,
    ChevronRight,
    ArrowLeft,
    Trash2,
    Check,
    X,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────

interface ParsedTransaction {
    _tempId: string;
    date: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    selected: boolean;
}

type Stage = "upload" | "preview" | "done";

// ── Component ───────────────────────────────────────────────────────

export default function ImportPage() {
    const { user, loading: authLoading } = useAuth();

    // Stage management
    const [stage, setStage] = useState<Stage>("upload");

    // Upload stage
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview stage
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
    const [meta, setMeta] = useState<{
        fileName: string;
        fileType: string;
        totalExtracted: number;
    } | null>(null);
    const [confirming, setConfirming] = useState(false);

    // Done stage
    const [importResult, setImportResult] = useState<{
        inserted: number;
        batchId: string;
    } | null>(null);

    // Categories for autocomplete
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        if (user?.email) {
            fetchCategories();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    async function fetchCategories() {
        try {
            const res = await fetch(
                `/api/categories?userId=${encodeURIComponent(user?.email || "")}`
            );
            const json = await res.json();
            if (json.success) {
                const names = (json.categories || []).map(
                    (c: { name: string }) => c.name
                );
                setCategories([...new Set(names)] as string[]);
            }
        } catch {
            // silent
        }
    }

    // ── File handling ──────────────────────────────────────────────

    const acceptedTypes = [
        "application/pdf",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    ];

    const acceptedExtensions = [".pdf", ".csv", ".xlsx", ".xls"];

    function isValidFile(f: File) {
        if (acceptedTypes.includes(f.type)) return true;
        return acceptedExtensions.some((ext) =>
            f.name.toLowerCase().endsWith(ext)
        );
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && isValidFile(dropped)) {
            setFile(dropped);
            setParseError(null);
        } else {
            setParseError("Please drop a PDF, CSV, or Excel file.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected && isValidFile(selected)) {
            setFile(selected);
            setParseError(null);
        } else if (selected) {
            setParseError("Unsupported file type.");
        }
    };

    function getFileIcon() {
        if (!file) return <Upload className="h-10 w-10" />;
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "pdf") return <FileText className="h-10 w-10 text-red-500" />;
        return <FileSpreadsheet className="h-10 w-10 text-emerald-500" />;
    }

    function formatFileSize(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // ── Parse file ─────────────────────────────────────────────────

    async function handleParse() {
        if (!file || !user?.email) return;

        setParsing(true);
        setParseError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", user.email);

            const res = await fetch("/api/import/parse", {
                method: "POST",
                body: formData,
            });

            const json = await res.json();

            if (!json.success) {
                setParseError(json.message || "Failed to parse file.");
                return;
            }

            if (json.transactions.length === 0) {
                setParseError(
                    "No transactions could be extracted from this file. Try a different format."
                );
                return;
            }

            setTransactions(json.transactions);
            setMeta(json.meta);
            setStage("preview");
        } catch {
            setParseError("Network error. Please try again.");
        } finally {
            setParsing(false);
        }
    }

    // ── Preview helpers ────────────────────────────────────────────

    function toggleSelect(tempId: string) {
        setTransactions((prev) =>
            prev.map((t) =>
                t._tempId === tempId ? { ...t, selected: !t.selected } : t
            )
        );
    }

    function toggleSelectAll() {
        const allSelected = transactions.every((t) => t.selected);
        setTransactions((prev) =>
            prev.map((t) => ({ ...t, selected: !allSelected }))
        );
    }

    function removeRow(tempId: string) {
        setTransactions((prev) => prev.filter((t) => t._tempId !== tempId));
    }

    function updateField(
        tempId: string,
        field: keyof ParsedTransaction,
        value: string | number
    ) {
        setTransactions((prev) =>
            prev.map((t) => (t._tempId === tempId ? { ...t, [field]: value } : t))
        );
    }

    const selectedTransactions = transactions.filter((t) => t.selected);
    const totalIncome = selectedTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = selectedTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    // ── Confirm import ─────────────────────────────────────────────

    async function handleConfirm() {
        if (selectedTransactions.length === 0) return;

        setConfirming(true);
        try {
            const res = await fetch("/api/import/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.email,
                    transactions: selectedTransactions.map((t) => ({
                        date: t.date,
                        description: t.description,
                        amount: t.amount,
                        type: t.type,
                        category: t.category,
                    })),
                }),
            });

            const json = await res.json();
            if (json.success) {
                setImportResult({
                    inserted: json.inserted,
                    batchId: json.batchId,
                });
                setStage("done");
            } else {
                setParseError(json.message || "Import failed.");
            }
        } catch {
            setParseError("Network error during import.");
        } finally {
            setConfirming(false);
        }
    }

    // ── Reset ──────────────────────────────────────────────────────

    function handleReset() {
        setStage("upload");
        setFile(null);
        setTransactions([]);
        setMeta(null);
        setImportResult(null);
        setParseError(null);
    }

    // ── Loading state ──────────────────────────────────────────────

    if (authLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Render ──────────────────────────────────────────────────────

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground">
                    Import Transactions
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Upload your bank statement or UPI transaction history to
                    auto-fill transactions.
                </p>
            </div>

            {/* Stage indicator */}
            <div className="flex items-center gap-2 mb-8">
                {["Upload", "Preview", "Done"].map((label, i) => {
                    const stageMap: Stage[] = ["upload", "preview", "done"];
                    const currentIdx = stageMap.indexOf(stage);
                    const isActive = i === currentIdx;
                    const isCompleted = i < currentIdx;

                    return (
                        <React.Fragment key={label}>
                            {i > 0 && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                            )}
                            <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : isCompleted
                                          ? "bg-primary/15 text-primary"
                                          : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {isCompleted && (
                                    <CheckCircle2 className="h-3 w-3" />
                                )}
                                {label}
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* ── STAGE 1: Upload ─────────────────────────────────── */}
            {stage === "upload" && (
                <div className="space-y-6">
                    {/* Drop zone */}
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                            dragOver
                                ? "border-primary bg-primary/5 scale-[1.01]"
                                : file
                                  ? "border-primary/40 bg-primary/[0.03]"
                                  : "border-border hover:border-primary/30 hover:bg-muted/30"
                        }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.csv,.xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="flex flex-col items-center gap-4">
                            <div
                                className={`rounded-2xl p-4 transition-colors ${
                                    file
                                        ? "bg-primary/10"
                                        : "bg-muted"
                                }`}
                            >
                                {getFileIcon()}
                            </div>

                            {file ? (
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatFileSize(file.size)} •{" "}
                                        {file.name
                                            .split(".")
                                            .pop()
                                            ?.toUpperCase()}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        Drop your file here, or{" "}
                                        <span className="text-primary">
                                            browse
                                        </span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Supports PDF, CSV, Excel (.xlsx, .xls)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    {parseError && (
                        <div className="flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            {parseError}
                        </div>
                    )}

                    {/* Action */}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleParse}
                            disabled={!file || parsing}
                            className="min-w-40"
                        >
                            {parsing ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Analyzing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Parse File
                                    <ChevronRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Info box */}
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">
                            How it works
                        </h3>
                        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                            <li>
                                Upload your transaction file (bank statement, UPI
                                export, etc.)
                            </li>
                            <li>
                                Our AI reads the file and extracts each
                                transaction with amount, date, and description
                            </li>
                            <li>
                                Review and edit the extracted data before
                                importing
                            </li>
                            <li>
                                Confirm to add all transactions to your account
                            </li>
                        </ol>
                    </div>
                </div>
            )}

            {/* ── STAGE 2: Preview ────────────────────────────────── */}
            {stage === "preview" && (
                <div className="space-y-5">
                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Upload different file
                        </button>
                        {meta && (
                            <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {meta.fileName}
                                </span>{" "}
                                • {meta.totalExtracted} transactions found
                            </p>
                        )}
                    </div>

                    {/* Summary bar */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl border bg-card p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                                Selected
                            </p>
                            <p className="text-xl font-bold text-foreground">
                                {selectedTransactions.length}
                                <span className="text-sm font-normal text-muted-foreground">
                                    /{transactions.length}
                                </span>
                            </p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                                Income
                            </p>
                            <p className="text-xl font-bold text-emerald-500">
                                +₹{totalIncome.toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                                Expenses
                            </p>
                            <p className="text-xl font-bold text-rose-500">
                                -₹{totalExpense.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Select all / Deselect all */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleSelectAll}
                        >
                            {transactions.every((t) => t.selected)
                                ? "Deselect All"
                                : "Select All"}
                        </Button>
                    </div>

                    {/* Transaction table */}
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        <th className="px-4 py-3 text-left w-10">
                                            <span className="sr-only">
                                                Select
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 w-10">
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((t) => (
                                        <tr
                                            key={t._tempId}
                                            className={`border-b last:border-0 transition-colors ${
                                                t.selected
                                                    ? "bg-background"
                                                    : "bg-muted/20 opacity-60"
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-4 py-2.5">
                                                <button
                                                    onClick={() =>
                                                        toggleSelect(t._tempId)
                                                    }
                                                    className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                                        t.selected
                                                            ? "bg-primary border-primary text-primary-foreground"
                                                            : "border-border hover:border-primary/50"
                                                    }`}
                                                >
                                                    {t.selected && (
                                                        <Check className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-2.5">
                                                <Input
                                                    type="date"
                                                    value={t.date}
                                                    onChange={(e) =>
                                                        updateField(
                                                            t._tempId,
                                                            "date",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="h-8 text-xs w-36 bg-transparent border-transparent hover:border-border focus:border-border"
                                                />
                                            </td>

                                            {/* Description */}
                                            <td className="px-4 py-2.5">
                                                <Input
                                                    value={t.description}
                                                    onChange={(e) =>
                                                        updateField(
                                                            t._tempId,
                                                            "description",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="h-8 text-xs bg-transparent border-transparent hover:border-border focus:border-border"
                                                />
                                            </td>

                                            {/* Amount */}
                                            <td className="px-4 py-2.5">
                                                <Input
                                                    type="number"
                                                    value={t.amount}
                                                    onChange={(e) =>
                                                        updateField(
                                                            t._tempId,
                                                            "amount",
                                                            Number(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    className="h-8 text-xs w-24 bg-transparent border-transparent hover:border-border focus:border-border"
                                                    step="0.01"
                                                />
                                            </td>

                                            {/* Type toggle */}
                                            <td className="px-4 py-2.5">
                                                <button
                                                    onClick={() =>
                                                        updateField(
                                                            t._tempId,
                                                            "type",
                                                            t.type ===
                                                                "income"
                                                                ? "expense"
                                                                : "income"
                                                        )
                                                    }
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                                        t.type === "income"
                                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                                    }`}
                                                >
                                                    {t.type === "income"
                                                        ? "Income"
                                                        : "Expense"}
                                                </button>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-2.5">
                                                <Input
                                                    value={t.category}
                                                    onChange={(e) =>
                                                        updateField(
                                                            t._tempId,
                                                            "category",
                                                            e.target.value
                                                        )
                                                    }
                                                    list="import-categories"
                                                    className="h-8 text-xs bg-transparent border-transparent hover:border-border focus:border-border"
                                                />
                                            </td>

                                            {/* Remove */}
                                            <td className="px-4 py-2.5">
                                                <button
                                                    onClick={() =>
                                                        removeRow(t._tempId)
                                                    }
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Category datalist for autocomplete */}
                        <datalist id="import-categories">
                            {categories.map((name) => (
                                <option key={name} value={name} />
                            ))}
                        </datalist>
                    </div>

                    {/* Error */}
                    {parseError && (
                        <div className="flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            {parseError}
                        </div>
                    )}

                    {/* Confirm button */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={
                                confirming ||
                                selectedTransactions.length === 0
                            }
                            className="min-w-48"
                        >
                            {confirming ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Importing...
                                </span>
                            ) : (
                                `Import ${selectedTransactions.length} Transaction${selectedTransactions.length !== 1 ? "s" : ""}`
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── STAGE 3: Done ───────────────────────────────────── */}
            {stage === "done" && importResult && (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                    {/* Success icon */}
                    <div className="rounded-full bg-emerald-500/15 p-5">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-foreground">
                            Import Complete!
                        </h2>
                        <p className="text-muted-foreground">
                            Successfully imported{" "}
                            <span className="font-semibold text-foreground">
                                {importResult.inserted}
                            </span>{" "}
                            transaction
                            {importResult.inserted !== 1 ? "s" : ""} into
                            your account.
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            Batch ID: {importResult.batchId}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={handleReset}>
                            Import More
                        </Button>
                        <Button
                            onClick={() =>
                                (window.location.href = "/dashboard")
                            }
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
