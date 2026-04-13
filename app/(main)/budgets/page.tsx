"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AddBudgetModal from "@/components/Budgets/AddBudgetModal";
import { useAuth } from "@/hooks/use-auth";

type Budget = {
  _id: string;
  category: string;
  amount: number;
  spent: number;
  percentage: number;
};

type Category = {
  _id: string;
  name: string;
};

export default function BudgetsPage() {
  const { user, loading: authLoading } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // For the dropdown
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (user?.email) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function fetchData() {
    setLoading(true);
    try {
      const email = user?.email;
      if (!email) return;

      // Parallel Fetch: Budgets & Categories (Expense only for budgets)
      const [budgetsRes, catsRes] = await Promise.all([
        fetch(`/api/budgets?userId=${encodeURIComponent(email)}`),
        fetch(
          `/api/categories?userId=${encodeURIComponent(email)}&type=expense`,
        ),
      ]);

      const budgetsJson = await budgetsRes.json();
      const catsJson = await catsRes.json();

      if (budgetsJson.success) setBudgets(budgetsJson.budgets);
      if (catsJson.success) setCategories(catsJson.categories);
    } catch (e) {
      console.error("Failed to load budgets", e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddBudget = async (newBudget: {
    category: string;
    amount: number;
  }) => {
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.email,
          ...newBudget,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData(); // Refresh to get updated calculations
      }
    } catch (e) {
      console.error("Failed to add budget", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget?")) return;
    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBudgets((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "#EF4444"; // Red
    if (percentage >= 80) return "#F59E0B"; // Amber/Yellow
    return "#10B981"; // Emerald/Green
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Monthly Budgets
          </h1>
          <p className="text-muted-foreground">
            Track your spending limits and stay disciplined.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Set Budget
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Loading...
          </div>
        ) : budgets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No budgets set. Create one to get started.
          </div>
        ) : (
          budgets.map((budget) => {
            const isOverBudget = budget.percentage > 100;
            const color = getProgressColor(budget.percentage);

            return (
              <div
                key={budget._id}
                className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {budget.category}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Limit: ₹{budget.amount.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(budget._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span
                      className={
                        isOverBudget
                          ? "font-bold text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      ₹{budget.spent.toLocaleString()} spent
                    </span>
                    <span className="font-medium text-muted-foreground">
                      {budget.percentage.toFixed(0)}%
                    </span>
                  </div>

                  <Progress
                    value={Math.min(budget.percentage, 100)}
                    className="h-2"
                    indicatorColor={color}
                  />

                  {isOverBudget && (
                    <div className="flex items-center gap-1 text-xs text-destructive mt-2 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      <span>
                        Over budget by ₹
                        {(budget.spent - budget.amount).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddBudget}
        categories={categories}
      />
    </div>
  );
}
