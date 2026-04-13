"use client";

import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Loader2,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth()),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  );
  const [data, setData] = useState<any>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (user?.email) {
      fetchReport();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, reportType, selectedMonth, selectedYear]);

  async function fetchReport() {
    try {
      setLoading(true);
      const email = user?.email;
      if (!email) return;

      const queryParams = new URLSearchParams({
        userId: email,
        type: reportType,
        year: selectedYear,
      });

      if (reportType === "monthly") {
        queryParams.append("month", selectedMonth);
      }

      const res = await fetch(`/api/reports?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleExportPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const dateStr =
      reportType === "monthly"
        ? `${format(new Date(parseInt(selectedYear), parseInt(selectedMonth)), "MMMM yyyy")}`
        : `${selectedYear}`;

    doc.setFontSize(20);
    doc.text(`Financial Report - ${dateStr}`, 14, 22);

    doc.setFontSize(12);
    doc.text(`Total Income: ${data.summary.income.toLocaleString()}`, 14, 32);
    doc.text(
      `Total Expenses: ${data.summary.expense.toLocaleString()}`,
      14,
      38,
    );
    doc.text(`Net Savings: ${data.summary.net.toLocaleString()}`, 14, 44);

    if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
      doc.text("Expense Breakdown:", 14, 55);

      const tableData = data.categoryBreakdown.map((item: any) => [
        item.name,
        item.value.toLocaleString(),
      ]);

      autoTable(doc, {
        startY: 60,
        head: [["Category", "Amount"]],
        body: tableData,
      });
    }

    doc.save(
      `report-${reportType}-${selectedYear}-${reportType === "monthly" ? parseInt(selectedMonth) + 1 : ""}.pdf`,
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8" ref={reportRef}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Visualize your financial health.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={reportType}
            onValueChange={(v: "monthly" | "yearly") => setReportType(v)}
          >
            <SelectTrigger className="w-30">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-25">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }).map((_, i) => {
                const y = new Date().getFullYear() - i;
                return (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {reportType === "monthly" && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32.5">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {format(new Date(2000, i, 1), "MMMM")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleExportPDF} variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="Total Income"
              value={data.summary.income}
              prevValue={data.comparison.income}
              icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
              color="text-emerald-500"
            />
            <SummaryCard
              title="Total Expenses"
              value={data.summary.expense}
              prevValue={data.comparison.expense}
              icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
              color="text-rose-500"
            />
            <SummaryCard
              title="Net Savings"
              value={data.summary.net}
              prevValue={data.comparison.net}
              icon={<DollarSign className="h-4 w-4 text-blue-500" />}
              color={data.summary.net >= 0 ? "text-blue-500" : "text-rose-500"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>
                  {reportType === "monthly"
                    ? "Daily Spending Trend"
                    : "Monthly Financial Trend"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-87.5 w-full">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.chartData}>
                      <defs>
                        <linearGradient
                          id="colorIncome"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.2}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f43f5e"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f43f5e"
                            stopOpacity={0.2}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        fill="url(#colorIncome)"
                        radius={[4, 4, 0, 0]}
                        name="Income"
                      />
                      <Bar
                        dataKey="expense"
                        fill="url(#colorExpense)"
                        radius={[4, 4, 0, 0]}
                        name="Expense"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Where your money went</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-87.5 w-full">
                  {data.categoryBreakdown.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No expenses recorded.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={data.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {data.categoryBreakdown.map(
                            (entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ),
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `₹${value.toLocaleString()}`
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
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, prevValue, icon, color }: any) {
  const diff = value - prevValue;
  const percentage = prevValue !== 0 ? (diff / Math.abs(prevValue)) * 100 : 0;
  const isPositive = diff >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          ₹{value.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {prevValue !== 0 && (
            <span className={isPositive ? "text-emerald-500" : "text-rose-500"}>
              {isPositive ? "+" : ""}
              {percentage.toFixed(1)}%
            </span>
          )}{" "}
          from last period
        </p>
      </CardContent>
    </Card>
  );
}
