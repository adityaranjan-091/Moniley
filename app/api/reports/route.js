import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const type = url.searchParams.get("type") || "monthly"; // monthly | yearly
        const month = parseInt(url.searchParams.get("month")); // 0-11
        const year = parseInt(url.searchParams.get("year"));

        if (!userId) {
            return NextResponse.json({ success: false, message: "Missing userId" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Determine Date Range using UTC to match how transaction dates are stored.
        // Transaction dates from date-only strings (e.g. "2026-06-18") are parsed as UTC midnight.
        const now = new Date();
        const targetYear = isNaN(year) ? now.getFullYear() : year;
        const targetMonth = isNaN(month) ? now.getMonth() : month;

        let currentStart, currentEnd, previousStart, previousEnd;

        if (type === 'monthly') {
            currentStart = new Date(Date.UTC(targetYear, targetMonth, 1));
            currentEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

            previousStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
            previousEnd = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
        } else {
            // Yearly
            currentStart = new Date(Date.UTC(targetYear, 0, 1));
            currentEnd = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

            previousStart = new Date(Date.UTC(targetYear - 1, 0, 1));
            previousEnd = new Date(Date.UTC(targetYear - 1, 11, 31, 23, 59, 59, 999));
        }

        // Fetch Transactions for Current and Previous Period in one query
        const transactions = await db.collection("transactions")
            .find({
                userId,
                date: {
                    $gte: previousStart,
                    $lte: currentEnd
                }
            })
            .sort({ date: -1 })
            .toArray();

        // Filter for Current and Previous
        const currentData = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= currentStart && d <= currentEnd;
        });

        const previousData = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= previousStart && d <= previousEnd;
        });

        // Aggregation with Number() coercion for safety
        const calculateTotals = (data) => {
            const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            return { income, expense, net: income - expense };
        };

        const currentTotals = calculateTotals(currentData);
        const previousTotals = calculateTotals(previousData);

        // ── Chart Data Generation ──
        let chartData = [];
        if (type === 'monthly') {
            const daysInMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const dayTransactions = currentData.filter(t => new Date(t.date).getUTCDate() === i);
                const { income, expense } = calculateTotals(dayTransactions);
                chartData.push({ name: `${i}`, income, expense });
            }
        } else {
            for (let i = 0; i < 12; i++) {
                const monthTransactions = currentData.filter(t => new Date(t.date).getUTCMonth() === i);
                const { income, expense } = calculateTotals(monthTransactions);
                const monthName = new Date(Date.UTC(targetYear, i, 1)).toLocaleString('default', { month: 'short' });
                chartData.push({ name: monthName, income, expense });
            }
        }

        // ── Expense Category Breakdown ──
        const expenseCategoryMap = {};
        currentData.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || "Uncategorized";
            expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + (Number(t.amount) || 0);
        });

        // ── Income Category Breakdown ──
        const incomeCategoryMap = {};
        currentData.filter(t => t.type === 'income').forEach(t => {
            const cat = t.category || "Uncategorized";
            incomeCategoryMap[cat] = (incomeCategoryMap[cat] || 0) + (Number(t.amount) || 0);
        });

        // ── Get Category Colors ──
        const allCategoryNames = [...new Set([...Object.keys(expenseCategoryMap), ...Object.keys(incomeCategoryMap)])];
        const categoryDocs = await db.collection("categories")
            .find({ userId, name: { $in: allCategoryNames } })
            .toArray();
        const colorMap = {};
        categoryDocs.forEach(c => colorMap[c.name] = c.color);

        const expenseColors = ["#f43f5e", "#ec4899", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1", "#e11d48"];
        const incomeColors = ["#10b981", "#059669", "#22d3ee", "#3b82f6", "#14b8a6", "#84cc16", "#06b6d4"];

        const categoryBreakdown = Object.entries(expenseCategoryMap).map(([name, value], index) => ({
            name,
            value,
            color: colorMap[name] || expenseColors[index % expenseColors.length]
        })).sort((a, b) => b.value - a.value);

        const incomeBreakdown = Object.entries(incomeCategoryMap).map(([name, value], index) => ({
            name,
            value,
            color: colorMap[name] || incomeColors[index % incomeColors.length]
        })).sort((a, b) => b.value - a.value);

        // ── Top 5 Biggest Expenses ──
        const topTransactions = currentData
            .filter(t => t.type === 'expense')
            .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
            .slice(0, 5)
            .map(t => ({
                _id: t._id,
                description: t.description || t.category || "Unnamed",
                category: t.category || "Uncategorized",
                amount: Number(t.amount) || 0,
                date: t.date,
            }));

        // ── Analytics / Insights ──
        const totalTransactions = currentData.length;
        const incomeTransactions = currentData.filter(t => t.type === 'income').length;
        const expenseTransactions = currentData.filter(t => t.type === 'expense').length;

        // Savings Rate
        const savingsRate = currentTotals.income > 0
            ? ((currentTotals.net / currentTotals.income) * 100)
            : 0;

        // Daily Average Spend
        let daysInPeriod;
        if (type === 'monthly') {
            daysInPeriod = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
        } else {
            // Check if leap year
            daysInPeriod = ((targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0) ? 366 : 365;
        }
        const dailyAverageExpense = daysInPeriod > 0 ? currentTotals.expense / daysInPeriod : 0;
        const dailyAverageIncome = daysInPeriod > 0 ? currentTotals.income / daysInPeriod : 0;

        // Highest Spend Day/Month
        let highestSpendPeriod = { name: "N/A", amount: 0 };
        if (chartData.length > 0) {
            const peak = chartData.reduce((max, d) => d.expense > max.expense ? d : max, chartData[0]);
            if (peak.expense > 0) {
                if (type === 'monthly') {
                    const dayNum = parseInt(peak.name);
                    const dateObj = new Date(Date.UTC(targetYear, targetMonth, dayNum));
                    highestSpendPeriod = {
                        name: dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
                        amount: peak.expense
                    };
                } else {
                    highestSpendPeriod = { name: peak.name, amount: peak.expense };
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                summary: currentTotals,
                comparison: previousTotals,
                chartData,
                categoryBreakdown,
                incomeBreakdown,
                topTransactions,
                insights: {
                    savingsRate: Math.round(savingsRate * 10) / 10,
                    dailyAverageExpense: Math.round(dailyAverageExpense),
                    dailyAverageIncome: Math.round(dailyAverageIncome),
                    highestSpendPeriod,
                    totalTransactions,
                    incomeTransactions,
                    expenseTransactions,
                },
                period: { type, month: targetMonth, year: targetYear }
            }
        });

    } catch (error) {
        console.error("GET /api/reports error:", error);
        return NextResponse.json({ success: false, message: "Server error", debug: error.message }, { status: 500 });
    }
}
