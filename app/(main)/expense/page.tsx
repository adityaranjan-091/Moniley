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
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Uncategorized");
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
    if (!description) {
      alert("Please enter a sentence in Description (e.g. 'Bought a coffee for 150') first.");
      return;
    }
    try {
      setIsCategorizing(true);
      const res = await fetch("/api/smart-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: description,
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
          category: category || "Uncategorized",
          description,
          date,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setExpenses((prev) => [json.transaction, ...prev]);
        setDescription("");
        setAmount("");
        setCategory("Uncategorized");
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
        className="grid grid-cols-1 gap-4 mb-8 bg-card p-6 rounded-xl border shadow-sm"
        onSubmit={handleAdd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Description</label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs px-2 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20" 
                onClick={handleSmartCategorize} 
                disabled={isCategorizing || !description}
              >
                 {isCategorizing ? "Thinking..." : "✨ Auto-fill"}
              </Button>
            </div>
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
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                {categoriesList.map((c) => (
                  <SelectItem key={c._id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
