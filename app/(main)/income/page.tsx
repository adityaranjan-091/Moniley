"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

type IncomeItem = {
  _id: string;
  userId: string;
  amount: number;
  description: string; // Mapped from 'source'
  date: string | Date;
  notes?: string;
  category?: string;
  type: "income";
};

export default function IncomePage() {
  const { user, loading: authLoading } = useAuth();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState(""); // Will map to 'description'
  const [smartInput, setSmartInput] = useState("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<
    { _id: string; name: string }[]
  >([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (user?.email) {
      fetchIncomes();
      fetchCategories();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function fetchIncomes() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/transactions?userId=${encodeURIComponent(user?.email || "")}&type=income`,
      );
      const json = await res.json();
      if (json.success) setIncomes(json.transactions || []);
      else setMessage(json.message || "Failed to load incomes");
    } catch (err) {
      setMessage("Failed to load incomes");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch(
        `/api/categories?userId=${encodeURIComponent(
          user?.email || "",
        )}&type=income`,
      );
      const json = await res.json();
      if (json.success) setCategoriesList(json.categories || []);
    } catch (err) {
      console.error("Failed to load categories");
    }
  }

  async function handleSmartCategorize() {
    if (!smartInput) {
      alert("Please enter a sentence describing the income first.");
      return;
    }
    try {
      setIsCategorizing(true);
      const res = await fetch("/api/smart-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: smartInput,
          type: "income",
          userId: user?.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.amount) setAmount(String(json.data.amount));
        if (json.data.category) setCategory(json.data.category);
        if (json.data.date) setDate(json.data.date);
        if (json.data.description && json.data.description !== "Uncategorized")
          setSource(json.data.description);
      } else {
        alert(json.message || "Failed to auto-categorize");
      }
    } catch (err) {
      alert("Error calling smart categorization");
    } finally {
      setIsCategorizing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!source || !amount) {
      setMessage("Please provide source and amount");
      return;
    }

    try {
      setLoading(true);
      const body = {
        userId: user?.email,
        amount: Number(amount),
        description: source, // Mapping 'source' to 'description'
        category,
        date,
        notes,
        type: "income",
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setIncomes((p) => [json.transaction, ...p]);
        setAmount("");
        setSource("");
        setNotes("");
        setCategory("");
        setMessage("Income added");
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(json.message || "Failed to add income");
      }
    } catch (err) {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this income?")) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIncomes((prev) => prev.filter((i) => i._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const total = incomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4 text-foreground">
        Add Income
      </h1>

      <div className="mb-6 bg-card border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          {/* AI Smart Entry Block */}
          <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-xl border border-green-200 dark:border-green-800/50">
            <label className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300 mb-3">
              ✨ AI Smart Entry
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="e.g., Received my salary of ₹80000 yesterday"
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                className="bg-white/80 dark:bg-background/80 border-green-200 dark:border-green-800/50 focus-visible:ring-green-500 shadow-inner"
              />
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap min-w-32.5 shadow-sm transition-all shadow-green-600/20"
                onClick={handleSmartCategorize}
                disabled={isCategorizing || !smartInput}
              >
                {isCategorizing ? "Thinking..." : "Auto-fill Form"}
              </Button>
            </div>
            <p className="text-xs text-green-600/80 dark:text-green-400/70 mt-2.5 font-medium tracking-tight">
              Just type what happened, and we'll automatically fill out the form
              below.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted/50" />
            </div>
            <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider">
              <span className="bg-card px-3 text-muted-foreground">
                Or Enter Manually
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <Input
                placeholder="e.g., Salary, Freelance"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <Input
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Freelance"
                list="income-categories"
              />
              <datalist id="income-categories">
                {categoriesList.map((c) => (
                  <option key={c._id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Input
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Saving..." : "Add Income"}
            </Button>
            {message && (
              <span className="text-sm text-green-600 font-medium animate-pulse">
                {message}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
        <div className="text-sm">{incomes.length} record(s)</div>
        <div className="text-lg font-bold text-green-700 dark:text-green-400">
          Total: ₹{total.toFixed(2)}
        </div>
      </div>

      <section>
        <h2 className="text-xl font-medium mb-3">Recent Incomes</h2>
        {loading && incomes.length === 0 ? (
          <div className="text-sm">Loading...</div>
        ) : incomes.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded text-center">
            No incomes yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {incomes.map((inc) => (
              <li
                key={inc._id}
                className="group bg-card border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-all"
              >
                <div>
                  <div className="font-medium text-foreground">
                    {inc.description}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(inc.date).toLocaleDateString()}{" "}
                    {inc.notes && `• ${inc.notes}`}
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    + ₹{Number(inc.amount).toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(inc._id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
