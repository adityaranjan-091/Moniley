"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
  Wallet,
  PiggyBank,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Target,
  Flame,
  BarChart3,
  Activity,
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

// ─── Types ───

type ReportData = {
  summary: { income: number; expense: number; net: number };
  comparison: { income: number; expense: number; net: number };
  chartData: Array<{ name: string; income: number; expense: number }>;
  categoryBreakdown: Array<{ name: string; value: number; color: string }>;
  incomeBreakdown: Array<{ name: string; value: number; color: string }>;
  topTransactions: Array<{
    _id: string;
    description: string;
    category: string;
    amount: number;
    date: string;
  }>;
  insights: {
    savingsRate: number;
    dailyAverageExpense: number;
    dailyAverageIncome: number;
    highestSpendPeriod: { name: string; amount: number };
    totalTransactions: number;
    incomeTransactions: number;
    expenseTransactions: number;
  };
  period: { type: string; month: number; year: number };
};

// ─── Main Component ───

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
  const [chartView, setChartView] = useState<"bar" | "area">("bar");
  const [data, setData] = useState<ReportData | null>(null);

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

    // Title
    doc.setFontSize(22);
    doc.setTextColor(34, 34, 34);
    doc.text(`Financial Report`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(dateStr, 14, 28);

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(34, 34, 34);
    doc.text("Summary", 14, 40);

    const summaryData = [
      ["Total Income", `₹${data.summary.income.toLocaleString()}`],
      ["Total Expenses", `₹${data.summary.expense.toLocaleString()}`],
      ["Net Savings", `₹${data.summary.net.toLocaleString()}`],
      ["Savings Rate", `${data.insights.savingsRate}%`],
      [
        "Daily Avg Expense",
        `₹${data.insights.dailyAverageExpense.toLocaleString()}`,
      ],
      ["Total Transactions", `${data.insights.totalTransactions}`],
    ];

    autoTable(doc, {
      startY: 44,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Expense Breakdown
    if (data.categoryBreakdown?.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 90;
      doc.setFontSize(14);
      doc.text("Expense Breakdown", 14, finalY + 12);

      autoTable(doc, {
        startY: finalY + 16,
        head: [["Category", "Amount"]],
        body: data.categoryBreakdown.map((item) => [
          item.name,
          `₹${item.value.toLocaleString()}`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [244, 63, 94] },
      });
    }

    // Top Expenses
    if (data.topTransactions?.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 140;
      doc.setFontSize(14);
      doc.text("Top Expenses", 14, finalY + 12);

      autoTable(doc, {
        startY: finalY + 16,
        head: [["Description", "Category", "Amount", "Date"]],
        body: data.topTransactions.map((t) => [
          t.description,
          t.category,
          `₹${t.amount.toLocaleString()}`,
          new Date(t.date).toLocaleDateString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [139, 92, 246] },
      });
    }

    doc.save(
      `moniley-report-${reportType}-${selectedYear}${reportType === "monthly" ? `-${parseInt(selectedMonth) + 1}` : ""}.pdf`,
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            Crunching your numbers...
          </p>
        </div>
      </div>
    );
  }

  const periodLabel =
    reportType === "monthly"
      ? format(
          new Date(parseInt(selectedYear), parseInt(selectedMonth)),
          "MMMM yyyy",
        )
      : selectedYear;

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* ── Header & Controls ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            {data ? (
              <>
                Insights for <span className="font-medium text-foreground">{periodLabel}</span>
              </>
            ) : (
              "Visualize your financial health."
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={reportType}
            onValueChange={(v: "monthly" | "yearly") => setReportType(v)}
          >
            <SelectTrigger className="w-30" id="report-type-select">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-25" id="report-year-select">
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
              <SelectTrigger className="w-32.5" id="report-month-select">
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

          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="gap-1.5"
            id="export-pdf-btn"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="Total Income"
              value={data.summary.income}
              prevValue={data.comparison.income}
              icon={<TrendingUp className="h-4 w-4" />}
              color="emerald"
              invertComparison={false}
            />
            <SummaryCard
              title="Total Expenses"
              value={data.summary.expense}
              prevValue={data.comparison.expense}
              icon={<TrendingDown className="h-4 w-4" />}
              color="rose"
              invertComparison={true}
            />
            <SummaryCard
              title="Net Savings"
              value={data.summary.net}
              prevValue={data.comparison.net}
              icon={<PiggyBank className="h-4 w-4" />}
              color={data.summary.net >= 0 ? "emerald" : "rose"}
              invertComparison={false}
            />
          </div>

          {/* ── Insight Cards ── */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <InsightCard
              title="Savings Rate"
              value={`${data.insights.savingsRate}%`}
              subtitle={
                data.insights.savingsRate >= 20
                  ? "Great discipline! 🎯"
                  : data.insights.savingsRate > 0
                    ? "Room to improve"
                    : "Spending exceeds income"
              }
              icon={<Target className="h-4 w-4" />}
              accent={
                data.insights.savingsRate >= 20
                  ? "text-emerald-500"
                  : data.insights.savingsRate > 0
                    ? "text-amber-500"
                    : "text-rose-500"
              }
            />
            <InsightCard
              title="Daily Avg Spend"
              value={`₹${data.insights.dailyAverageExpense.toLocaleString()}`}
              subtitle={`₹${data.insights.dailyAverageIncome.toLocaleString()} avg income`}
              icon={<Activity className="h-4 w-4" />}
              accent="text-blue-500"
            />
            <InsightCard
              title="Transactions"
              value={`${data.insights.totalTransactions}`}
              subtitle={`${data.insights.incomeTransactions} in · ${data.insights.expenseTransactions} out`}
              icon={<Receipt className="h-4 w-4" />}
              accent="text-violet-500"
            />
            <InsightCard
              title={
                reportType === "monthly"
                  ? "Highest Spend Day"
                  : "Highest Spend Month"
              }
              value={data.insights.highestSpendPeriod.name}
              subtitle={
                data.insights.highestSpendPeriod.amount > 0
                  ? `₹${data.insights.highestSpendPeriod.amount.toLocaleString()} spent`
                  : "No spending data"
              }
              icon={<Flame className="h-4 w-4" />}
              accent="text-orange-500"
            />
          </div>

          {/* ── Trend Chart ── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>
                  {reportType === "monthly"
                    ? "Daily Spending Trend"
                    : "Monthly Financial Trend"}
                </CardTitle>
                <CardDescription>Income vs Expenses over time</CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <Button
                  variant={chartView === "bar" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setChartView("bar")}
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1" />
                  Bar
                </Button>
                <Button
                  variant={chartView === "area" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setChartView("area")}
                >
                  <Activity className="h-3.5 w-3.5 mr-1" />
                  Area
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === "bar" ? (
                    <BarChart data={data.chartData}>
                      <defs>
                        <linearGradient
                          id="gradIncome"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gradExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f43f5e"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f43f5e"
                            stopOpacity={0.3}
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
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid hsl(var(--border))",
                          boxShadow:
                            "0 4px 12px -2px rgb(0 0 0 / 0.1)",
                          fontSize: "13px",
                        }}
                        formatter={(value: any) => [
                          `₹${Number(value).toLocaleString()}`,
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        fill="url(#gradIncome)"
                        radius={[4, 4, 0, 0]}
                        name="Income"
                      />
                      <Bar
                        dataKey="expense"
                        fill="url(#gradExpense)"
                        radius={[4, 4, 0, 0]}
                        name="Expense"
                      />
                    </BarChart>
                  ) : (
                    <AreaChart data={data.chartData}>
                      <defs>
                        <linearGradient
                          id="areaIncome"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="areaExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f43f5e"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f43f5e"
                            stopOpacity={0}
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
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid hsl(var(--border))",
                          boxShadow:
                            "0 4px 12px -2px rgb(0 0 0 / 0.1)",
                          fontSize: "13px",
                        }}
                        formatter={(value: any) => [
                          `₹${Number(value).toLocaleString()}`,
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#areaIncome)"
                        name="Income"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fill="url(#areaExpense)"
                        name="Expense"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ── Breakdown Charts Row ── */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Expense Breakdown
                </CardTitle>
                <CardDescription>Where your money went</CardDescription>
              </CardHeader>
              <CardContent>
                {data.categoryBreakdown.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                    No expenses recorded.
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="w-full lg:w-1/2">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={data.categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {data.categoryBreakdown.map(
                              (entry, index) => (
                                <Cell
                                  key={`exp-${index}`}
                                  fill={entry.color}
                                />
                              ),
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value) =>
                              `₹${Number(value ?? 0).toLocaleString()}`
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full lg:w-1/2 space-y-2">
                      {data.categoryBreakdown.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate max-w-36">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              ₹{item.value.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground text-xs w-10 text-right">
                              {data.summary.expense > 0
                                ? `${((item.value / data.summary.expense) * 100).toFixed(0)}%`
                                : "0%"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Income Sources
                </CardTitle>
                <CardDescription>Where your money came from</CardDescription>
              </CardHeader>
              <CardContent>
                {data.incomeBreakdown.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                    No income recorded.
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="w-full lg:w-1/2">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={data.incomeBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {data.incomeBreakdown.map(
                              (entry, index) => (
                                <Cell
                                  key={`inc-${index}`}
                                  fill={entry.color}
                                />
                              ),
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value) =>
                              `₹${Number(value ?? 0).toLocaleString()}`
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full lg:w-1/2 space-y-2">
                      {data.incomeBreakdown.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate max-w-36">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              ₹{item.value.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground text-xs w-10 text-right">
                              {data.summary.income > 0
                                ? `${((item.value / data.summary.income) * 100).toFixed(0)}%`
                                : "0%"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Top Expenses Table ── */}
          {data.topTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Biggest Expenses
                </CardTitle>
                <CardDescription>
                  Your top spending transactions this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left font-medium py-2.5 pr-4">
                          #
                        </th>
                        <th className="text-left font-medium py-2.5 pr-4">
                          Description
                        </th>
                        <th className="text-left font-medium py-2.5 pr-4">
                          Category
                        </th>
                        <th className="text-right font-medium py-2.5 pr-4">
                          Amount
                        </th>
                        <th className="text-right font-medium py-2.5">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topTransactions.map((t, i) => (
                        <tr
                          key={t._id}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 pr-4 text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="py-3 pr-4 font-medium">
                            {t.description}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right font-semibold text-rose-500">
                            ₹{t.amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-muted-foreground">
                            {new Date(t.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-lg font-medium">
            No report data available
          </p>
          <p className="text-muted-foreground/70 text-sm mt-1">
            Add some transactions to see your financial insights here.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Summary Card Component ───

function SummaryCard({
  title,
  value,
  prevValue,
  icon,
  color,
  invertComparison,
}: {
  title: string;
  value: number;
  prevValue: number;
  icon: React.ReactNode;
  color: "emerald" | "rose" | "blue";
  invertComparison: boolean;
}) {
  const diff = value - prevValue;
  const percentage =
    prevValue !== 0 ? (diff / Math.abs(prevValue)) * 100 : 0;

  // For expenses, an increase is bad (show red), a decrease is good (show green)
  // For income/savings, an increase is good (show green), a decrease is bad (show red)
  const isGood = invertComparison ? diff <= 0 : diff >= 0;

  const colorMap = {
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "text-emerald-500",
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-600 dark:text-rose-400",
      icon: "text-rose-500",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      icon: "text-blue-500",
    },
  };

  const c = colorMap[color];

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-1.5 rounded-lg ${c.bg}`}>
          <span className={c.icon}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${c.text}`}>
          ₹{Math.abs(value).toLocaleString()}
        </div>
        {prevValue !== 0 && percentage !== 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {isGood ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span
              className={`text-xs font-medium ${isGood ? "text-emerald-500" : "text-rose-500"}`}
            >
              {Math.abs(percentage).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">
              vs last period
            </span>
          </div>
        )}
        {prevValue === 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            No prior data to compare
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Insight Card Component ───

function InsightCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <span className={accent}>{icon}</span>
          <span className="text-xs font-medium uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className={`text-xl font-bold ${accent}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
