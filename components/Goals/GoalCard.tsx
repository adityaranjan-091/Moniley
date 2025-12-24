"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2, AlertCircle } from "lucide-react";

type Goal = {
    id: string;
    name: string;
    targetAmount: number;
    category: string;
    deadline?: string;
};

type GoalCardProps = {
    goal: Goal;
    currentSavings: number;
    onDelete: (id: string) => void;
};

export default function GoalCard({ goal, currentSavings, onDelete }: GoalCardProps) {
    const isAffordable = currentSavings >= goal.targetAmount;
    const progress = Math.min((currentSavings / goal.targetAmount) * 100, 100);
    const remaining = Math.max(goal.targetAmount - currentSavings, 0);

    return (
        <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <span className="mb-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {goal.category}
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">{goal.name}</h3>
                    {goal.deadline && (
                        <p className="text-xs text-muted-foreground">
                            Target: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(goal.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="mt-6 space-y-2">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Target</p>
                        <p className="text-xl font-bold text-foreground">
                            ₹{goal.targetAmount.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">You have</p>
                        <p className={`font-semibold ${isAffordable ? "text-green-600" : "text-orange-600"}`}>
                            ₹{currentSavings.toLocaleString()}
                        </p>
                    </div>
                </div>

                <Progress value={progress} className="h-2" />

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    {isAffordable ? (
                        <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <p className="text-sm font-medium text-green-700">
                                You can afford this now!
                            </p>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            <p className="text-sm font-medium text-orange-700">
                                Save ₹{remaining.toLocaleString()} more
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
