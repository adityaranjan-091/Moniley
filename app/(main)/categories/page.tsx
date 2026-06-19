"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AddCategoryModal from "@/components/Categories/AddCategoryModal";
import { useAuth } from "@/hooks/use-auth";

type Category = {
  _id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
};

type Transaction = {
  amount: number;
  category: string;
  type: "income" | "expense";
};

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user?.email) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      const email = user?.email;
      if (!email) return;

      // Parallel Fetch: Categories & Transactions
      const [catRes, transRes] = await Promise.all([
        fetch(
          `/api/categories?userId=${encodeURIComponent(email)}&type=${activeTab}`,
        ),
        fetch(
          `/api/transactions?userId=${encodeURIComponent(email)}&type=${activeTab}`,
        ),
      ]);

      const catJson = await catRes.json();
      const transJson = await transRes.json();

      if (catJson.success) setCategories(catJson.categories);
      if (transJson.success) setTransactions(transJson.transactions);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddCategory = async (newCat: { name: string; color: string; icon: string }) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.email,
          type: activeTab,
          ...newCat,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories((prev) => [...prev, json.category]);
      }
    } catch (e) {
      console.error("Failed to add category", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate Analytics
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const categoryStats = categories.map((cat) => {
    const spent = transactions
      .filter((t) => t.category === cat.name) // Simple name matching for now
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...cat,
      spent,
      percentage: totalSpent ? (spent / totalSpent) * 100 : 0,
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">
            Manage and analyze your {activeTab} sources.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-muted p-1 w-fit">
        {(["expense", "income"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
            } capitalize`}
          >
            {tab}s
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Loading...
          </div>
        ) : categoryStats.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No categories found. Create one to get started.
          </div>
        ) : (
          categoryStats.map((cat) => (
            <div
              key={cat._id}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                    }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === "expense" ? "Spent" : "Earned"}: ₹
                      {cat.spent.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cat._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Contribution</span>
                  <span className="font-medium">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={cat.percentage}
                  className="h-1.5"
                  indicatorColor={cat.color}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={activeTab}
        onAdd={handleAddCategory}
      />
    </div>
  );
}
