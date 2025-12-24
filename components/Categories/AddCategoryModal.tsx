"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type AddCategoryModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (category: any) => void;
    type: "income" | "expense";
};

const COLORS = [
    "#EF4444", // Red
    "#F97316", // Orange
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#06B6D4", // Cyan
    "#3B82F6", // Blue
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#64748B", // Slate
];

const ICONS = ["🍔", "🏠", "✈️", "💼", "📈", "🛒", "🚗", "💊", "🎓", "🎁", "💡", "🎬"];

export default function AddCategoryModal({
    isOpen,
    onClose,
    onAdd,
    type,
}: AddCategoryModalProps) {
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setLoading(true);
        await onAdd({ name, color: selectedColor, icon: selectedIcon });
        setLoading(false);

        setName("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New {type === "income" ? "Income" : "Expense"} Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Category Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Groceries"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Color Code</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`h-8 w-8 rounded-full border-2 transition-all ${selectedColor === c ? "border-black dark:border-white scale-110" : "border-transparent"
                                        }`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setSelectedColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Icon</Label>
                        <div className="flex flex-wrap gap-2">
                            {ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    className={`h-10 w-10 text-xl rounded-md border transition-all ${selectedIcon === icon ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                                        }`}
                                    onClick={() => setSelectedIcon(icon)}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Category"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
