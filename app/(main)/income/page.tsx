"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const { data: session } = useSession();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState(""); // Will map to 'description'
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchIncomes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function fetchIncomes() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/transactions?userId=${encodeURIComponent(session?.user?.email || "")}&type=income`
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
        userId: session?.user?.email,
        amount: Number(amount),
        description: source, // Mapping 'source' to 'description'
        date,
        notes,
        type: "income"
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
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIncomes(prev => prev.filter(i => i._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const total = incomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4 text-foreground">Add Income</h1>

      <div className="mb-6 bg-card border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
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
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
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
              <span className="text-sm text-green-600 font-medium animate-pulse">{message}</span>
            )}
          </div>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
        <div className="text-sm">
          {incomes.length} record(s)
        </div>
        <div className="text-lg font-bold text-green-700 dark:text-green-400">Total: ₹{total.toFixed(2)}</div>
      </div>

      <section>
        <h2 className="text-xl font-medium mb-3">Recent Incomes</h2>
        {loading && incomes.length === 0 ? (
          <div className="text-sm">Loading...</div>
        ) : incomes.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded text-center">No incomes yet.</div>
        ) : (
          <ul className="space-y-2">
            {incomes.map((inc) => (
              <li
                key={inc._id}
                className="group bg-card border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-all"
              >
                <div>
                  <div className="font-medium text-foreground">{inc.description}</div>
                  <div className="text-sm text-muted-foreground">{new Date(inc.date).toLocaleDateString()} {inc.notes && `• ${inc.notes}`}</div>
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
