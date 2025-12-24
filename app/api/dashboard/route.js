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

        // Dates for Monthly Stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Fetch Transactions with Filter
        const allTransactions = await db.collection("transactions")
            .find(query)
            .sort({ date: -1 })
            .toArray();

        // 1. Total Balance (All Time)
        const totalIncome = allTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = allTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalBalance = totalIncome - totalExpense;

        // 2. Monthly Stats
        const monthlyTransactions = allTransactions.filter(t => {
            const d = new Date(t.date);
            return d >= startOfMonth && d <= endOfMonth;
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const netSavings = monthlyIncome - monthlyExpense;

        // 3. Expense Breakdown (Current Month)
        const expenseMap = {};
        monthlyTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const cat = t.category || "Uncategorized";
                expenseMap[cat] = (expenseMap[cat] || 0) + t.amount;
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

        const expenseBreakdown = Object.entries(expenseMap).map(([name, value]) => ({
            name,
            value,
            color: colorMap[name] || "#8884d8" // Default color if not found
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
