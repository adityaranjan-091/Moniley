"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoalCard from "@/components/Goals/GoalCard";
import AddGoalModal from "@/components/Goals/AddGoalModal";
import { useAuth } from "@/hooks/use-auth";

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  category: string;
  deadline?: string;
};

export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load Goals from LocalStorage
  useEffect(() => {
    if (authLoading) return;

    const saved = localStorage.getItem("user_goals");
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse goals", e);
      }
    }
  }, []);

  // Save Goals to LocalStorage
  useEffect(() => {
    localStorage.setItem("user_goals", JSON.stringify(goals));
  }, [goals]);

  // Fetch Real Savings from Transactions API
  useEffect(() => {
    if (authLoading) return;

    async function fetchBalance() {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/transactions?userId=${encodeURIComponent(user.email)}`,
        );
        const json = await res.json();
        if (json.success) {
          const transactions = json.transactions;
          const income = transactions
            .filter((t: { type: string; amount: number }) => t.type === "income")
            .reduce((sum: number, t: { type: string; amount: number }) => sum + t.amount, 0);
          const expense = transactions
            .filter((t: { type: string; amount: number }) => t.type === "expense")
            .reduce((sum: number, t: { type: string; amount: number }) => sum + t.amount, 0);

          setCurrentSavings(income - expense);
        }
      } catch (err) {
        console.error("Failed to fetch balance", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [authLoading, user]);

  const handleAddGoal = (newGoal: Goal) => {
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm("Remove this goal?")) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Financial Goals
          </h1>
          <p className="text-muted-foreground">
            Track your savings and achieve your dreams.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </div>

      {/* Savings Summary */}
      <div className="rounded-xl bg-linear-to-br from-primary/90 to-primary p-6 text-primary-foreground shadow-lg">
        <p className="text-sm font-medium opacity-80">Available Savings</p>
        <h2 className="mt-1 text-4xl font-bold">
          {loading ? "..." : `₹${currentSavings.toLocaleString()}`}
        </h2>
        <p className="mt-2 text-xs opacity-70">
          Calculated from your Incomes - Expenses
        </p>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            currentSavings={currentSavings}
            onDelete={handleDeleteGoal}
          />
        ))}

        {goals.length === 0 && (
          <div className="col-span-full border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
            <p>No goals set yet. Click "New Goal" to get started!</p>
          </div>
        )}
      </div>

      <AddGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddGoal}
      />
    </div>
  );
}
