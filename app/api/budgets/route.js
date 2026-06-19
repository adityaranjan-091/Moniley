import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, message: "Missing userId" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // 1. Fetch User's Budgets
        const budgets = await db.collection("budgets").find({ userId }).toArray();

        // 2. Fetch User's Transactions for CURRENT MONTH
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const transactions = await db.collection("transactions").find({
            userId,
            type: "expense",
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }).toArray();

        // 3. Aggregate Spending per Category
        const spendingMap = {};

        transactions.forEach(t => {
            const key = t.categoryId ? t.categoryId.toString() : t.category;
            if (key) {
                spendingMap[key] = (spendingMap[key] || 0) + t.amount;
            }
        });

        // 4. Merge Budget + Spent
        const budgetsWithStats = budgets.map(b => {
            const key = b.categoryId ? b.categoryId.toString() : b.category;
            const spent = spendingMap[key] || 0;
            const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
            return {
                ...b,
                spent,
                percentage
            };
        });

        return NextResponse.json({ success: true, budgets: budgetsWithStats }, { status: 200 });

    } catch (error) {
        console.error("GET /api/budgets error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { userId, category, amount } = await req.json();

        if (!userId || !category || !amount) {
            return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Look up categoryId
        const existingCategory = await db.collection("categories").findOne({ userId, name: category, type: "expense" });
        const categoryId = existingCategory ? existingCategory._id : null;

        // Upsert Budget
        const _result = await db.collection("budgets").updateOne(
            { userId, category }, // Keeping category in query for backwards compatibility on upsert
            {
                $set: {
                    userId,
                    category,
                    ...(categoryId ? { categoryId } : {}),
                    amount: Number(amount),
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: "Budget saved" }, { status: 200 });

    } catch (error) {
        console.error("POST /api/budgets error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection("budgets").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            return NextResponse.json({ success: true, message: "Deleted" }, { status: 200 });
        }

        return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    } catch (error) {
        console.error("DELETE /api/budgets error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
