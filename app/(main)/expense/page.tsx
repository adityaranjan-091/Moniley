"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "next-auth/react";

type Expense = {
  _id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string | Date;
  type: "expense";
};

export default function ExpensePage() {
  const { data: session } = useSession();
  const [description, setDescription] = useState("");
  const [smartInput, setSmartInput] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<{_id: string, name: string}[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchExpenses();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/transactions?userId=${encodeURIComponent(
          session?.user?.email || ""
        )}&type=expense`
      );
      const json = await res.json();
      if (json.success) setExpenses(json.transactions || []);
      else console.error(json.message);
    } catch (err) {
      console.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch(
        `/api/categories?userId=${encodeURIComponent(
          session?.user?.email || ""
        )}&type=expense`
      );
      const json = await res.json();
      if (json.success) setCategoriesList(json.categories || []);
    } catch (err) {
      console.error("Failed to load categories");
    }
  }

  async function handleSmartCategorize() {
    if (!smartInput) {
      alert("Please enter a sentence describing the expense first.");
      return;
    }
    try {
      setIsCategorizing(true);
      const res = await fetch("/api/smart-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: smartInput,
          type: "expense",
          userId: session?.user?.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.amount) setAmount(String(json.data.amount));
        if (json.data.category) setCategory(json.data.category);
        if (json.data.date) setDate(json.data.date);
        if (json.data.description && json.data.description !== "Uncategorized") {
          setDescription(json.data.description);
        }
      } else {
        alert(json.message || "Failed to auto-categorize");
      }
    } catch (err) {
      alert("Error calling smart categorization");
    } finally {
      setIsCategorizing(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount || Number(amount) <= 0) {
      alert("Please provide valid description and amount");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.email,
          type: "expense",
          amount: Number(amount),
          category,
          description,
          date,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setExpenses((prev) => [json.transaction, ...prev]);
        setDescription("");
        setAmount("");
        setCategory("");
        setMessage("Expense added successfully");
        setTimeout(() => setMessage(null), 3000);
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        setExpenses((s) => s.filter((x) => x._id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (e) {
      alert("Error deleting");
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-foreground">Expenses</h1>

      <form
        className="grid grid-cols-1 gap-6 mb-8 bg-card p-6 rounded-xl border shadow-sm"
        onSubmit={handleAdd}
      >
        {/* AI Smart Entry Block */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
          <label className="block text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
            ✨ AI Smart Entry
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g., Bought 2 coffees for ₹150 yesterday"
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              className="bg-white/80 dark:bg-background/80 border-indigo-200 dark:border-indigo-800/50 focus-visible:ring-indigo-500 shadow-inner"
            />
            <Button 
              type="button" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap min-w-[130px] shadow-sm transition-all shadow-indigo-600/20" 
              onClick={handleSmartCategorize} 
              disabled={isCategorizing || !smartInput}
            >
              {isCategorizing ? "Thinking..." : "Auto-fill Form"}
            </Button>
          </div>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/70 mt-2.5 font-medium tracking-tight">Just type what happened, and we'll automatically fill out the form below.</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted/50" />
          </div>
          <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider">
            <span className="bg-card px-3 text-muted-foreground">Or Enter Manually</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bought 2 coffees for 150 yesterday"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Dining Out"
              list="expense-categories"
            />
            <datalist id="expense-categories">
              {categoriesList.map((c) => (
                <option key={c._id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <Input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-green-600">{message}</span>
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Saving..." : "Add Expense"}
          </Button>
        </div>
      </form>

      <div className="mb-4 flex items-center justify-between bg-secondary/50 p-4 rounded-lg">
        <div className="text-sm">
          {expenses.length} transaction(s)
        </div>
        <div className="text-lg font-bold text-primary">Total: ₹{total.toFixed(2)}</div>
      </div>

      <div className="space-y-3">
        {loading && expenses.length === 0 ? (
          <div>Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center bg-muted/20 rounded-lg text-muted-foreground">
            No expenses recorded yet.
          </div>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp._id}
              className="group flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-all"
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{exp.description}</span>
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground">{exp.category}</span>
                  <span>• {new Date(exp.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-red-500">- ₹{exp.amount.toFixed(2)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(exp._id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
