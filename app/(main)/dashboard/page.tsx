"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";

type DashboardData = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netSavings: number;
  expenseBreakdown: Array<{ name: string; value: number; color: string }>;
  recentTransactions: Array<{
    _id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    category: string;
  }>;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user?.email) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, search]);

  async function fetchData() {
    try {
      const email = user?.email;
      if (!email) return;

      const res = await fetch(
        `/api/dashboard?userId=${encodeURIComponent(email)}&search=${encodeURIComponent(search)}`,
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to load dashboard", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Welcome to Moniley</h1>

      {/* Top Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Balance"
          value={data.totalBalance}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Monthly Income"
          value={data.monthlyIncome}
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          textColor="text-emerald-500"
        />
        <StatsCard
          title="Monthly Expenses"
          value={data.monthlyExpense}
          icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
          textColor="text-rose-500"
        />
        <StatsCard
          title="Net Savings"
          value={data.netSavings}
          icon={<PiggyBank className="h-4 w-4 text-blue-500" />}
          textColor={data.netSavings >= 0 ? "text-blue-500" : "text-rose-500"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Transactions (Left 4 cols) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent transactions.
                </p>
              ) : (
                data.recentTransactions.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {t.description || t.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`font-medium ${t.type === "income" ? "text-emerald-500" : ""}`}
                    >
                      {t.type === "income" ? "+" : "-"}₹
                      {t.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown (Right 3 cols) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-75 w-full">
              {data.expenseBreakdown.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No expenses this month.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `₹${Number(value || 0).toLocaleString()}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  textColor,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  textColor?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${textColor}`}>
          ₹{value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
