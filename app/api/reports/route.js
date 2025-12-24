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

        // Determine Date Range
        let currentStart, currentEnd, previousStart, previousEnd;
        const now = new Date();
        const targetYear = isNaN(year) ? now.getFullYear() : year;
        const targetMonth = isNaN(month) ? now.getMonth() : month;

        if (type === 'monthly') {
            currentStart = new Date(targetYear, targetMonth, 1);
            currentEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

            previousStart = new Date(targetYear, targetMonth - 1, 1);
            previousEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);
        } else {
            // Yearly
            currentStart = new Date(targetYear, 0, 1);
            currentEnd = new Date(targetYear, 11, 31, 23, 59, 59);

            previousStart = new Date(targetYear - 1, 0, 1);
            previousEnd = new Date(targetYear - 1, 11, 31, 23, 59, 59);
        }

        // Fetch Transactions for Current and Previous Period
        const transactions = await db.collection("transactions")
            .find({
                userId,
                date: {
                    $gte: previousStart,
                    $lte: currentEnd
                }
            })
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

        // Aggregation Functions
        const calculateTotals = (data) => {
            const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            return { income, expense, net: income - expense };
        };

        const currentTotals = calculateTotals(currentData);
        const previousTotals = calculateTotals(previousData);

        // Chart Data Generation
        let chartData = [];
        if (type === 'monthly') {
            // Daily breakdown
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const dayTransactions = currentData.filter(t => new Date(t.date).getDate() === i);
                const { income, expense } = calculateTotals(dayTransactions);
                if (income > 0 || expense > 0) {
                    // Only push if there's data, or push all days? pushing all days is better for axis
                    chartData.push({ name: `${i}`, income, expense });
                } else {
                    chartData.push({ name: `${i}`, income: 0, expense: 0 });
                }
            }
        } else {
            // Monthly breakdown
            for (let i = 0; i < 12; i++) {
                const monthTransactions = currentData.filter(t => new Date(t.date).getMonth() === i);
                const { income, expense } = calculateTotals(monthTransactions);
                const monthName = new Date(targetYear, i, 1).toLocaleString('default', { month: 'short' });
                chartData.push({ name: monthName, income, expense });
            }
        }

        // Category Breakdown (Expense only usually)
        const categoryMap = {};
        currentData.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || "Uncategorized";
            categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
        });

        // Get colors
        const uniqueCategories = Object.keys(categoryMap);
        const categoryDocs = await db.collection("categories")
            .find({ userId, name: { $in: uniqueCategories }, type: 'expense' })
            .toArray();
        const colorMap = {};
        categoryDocs.forEach(c => colorMap[c.name] = c.color);

        const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value,
            color: colorMap[name] || "#8884d8"
        })).sort((a, b) => b.value - a.value);

        return NextResponse.json({
            success: true,
            data: {
                summary: currentTotals,
                comparison: previousTotals,
                chartData,
                categoryBreakdown,
                period: { type, month: targetMonth, year: targetYear }
            }
        });

    } catch (error) {
        console.error("GET /api/reports error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
