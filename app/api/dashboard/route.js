import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const search = url.searchParams.get("search") || "";

        if (!userId) {
            return NextResponse.json({ success: false, message: "Missing userId" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Query Construction
        const query = { userId };
        if (search) {
            const regex = new RegExp(search, "i"); // Case-insensitive
            query.$or = [
                { description: { $regex: regex } },
                { category: { $regex: regex } }
            ];
        }

        // Dates for Monthly Stats (use UTC to match how transaction dates are stored)
        // Transaction dates from date-only strings (e.g. "2026-06-18") are parsed as UTC midnight,
        // so we must compare using UTC boundaries to avoid timezone-related mismatches.
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

        // Fetch ALL transactions for this user (without search filter) for balance calculation
        const allTransactionsForBalance = await db.collection("transactions")
            .find({ userId })
            .sort({ date: -1 })
            .toArray();

        // Fetch transactions with search filter for display purposes
        const allTransactions = search
            ? await db.collection("transactions").find(query).sort({ date: -1 }).toArray()
            : allTransactionsForBalance;

        // 1. Total Balance (All Time - should NOT be affected by search filter)
        const totalIncome = allTransactionsForBalance
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const totalExpense = allTransactionsForBalance
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const totalBalance = totalIncome - totalExpense;

        // 2. Monthly Stats (from ALL transactions, not filtered by search)
        const monthlyTransactions = allTransactionsForBalance.filter(t => {
            const d = new Date(t.date);
            return d >= startOfMonth && d <= endOfMonth;
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const monthlyExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const netSavings = monthlyIncome - monthlyExpense;

        // 3. Expense Breakdown (Current Month)
        const expenseMap = {};
        monthlyTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const cat = t.category || "Uncategorized";
                expenseMap[cat] = (expenseMap[cat] || 0) + (Number(t.amount) || 0);
            });

        // Convert Map to Array for Recharts
        // Also fetch category colors if possible, but for now we might rely on frontend or basic colors
        // Ideally we would join with Categories collection to get colors.

        // Let's do a quick lookup for categories to get colors
        const uniqueCategories = Object.keys(expenseMap);
        const categoryDocs = await db.collection("categories")
            .find({ userId, name: { $in: uniqueCategories }, type: 'expense' })
            .toArray();

        const colorMap = {};
        categoryDocs.forEach(c => colorMap[c.name] = c.color);

        const fallbackColors = ["#8b5cf6", "#ec4899", "#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#6366f1"];
        const expenseBreakdown = Object.entries(expenseMap).map(([name, value], index) => ({
            name,
            value,
            color: colorMap[name] || fallbackColors[index % fallbackColors.length]
        })).sort((a, b) => b.value - a.value); // Sort highest expense first


        // 4. Recent Transactions (Top 5)
        const recentTransactions = allTransactions.slice(0, 5);

        return NextResponse.json({
            success: true,
            data: {
                totalBalance,
                monthlyIncome,
                monthlyExpense,
                netSavings,
                expenseBreakdown,
                recentTransactions
            }
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/dashboard error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
