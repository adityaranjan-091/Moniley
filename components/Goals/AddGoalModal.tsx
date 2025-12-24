"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type AddGoalModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (goal: any) => void;
};

export default function AddGoalModal({ isOpen, onClose, onAdd }: AddGoalModalProps) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [deadline, setDeadline] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        onAdd({
            id: Date.now().toString(),
            name,
            targetAmount: Number(amount),
            category: category || "General",
            deadline,
        });

        setName("");
        setAmount("");
        setCategory("");
        setDeadline("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set a New Goal</DialogTitle>
                    <DialogDescription>
                        What are you saving for?
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Goal Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. New Laptop"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Target Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            placeholder="e.g. Tech, Travel"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="deadline">Target Date (Optional)</Label>
                        <Input
                            id="deadline"
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Goal</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
