import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
    try {
        const { userId, transactions } = await req.json();

        if (!userId || !Array.isArray(transactions) || transactions.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing userId or transactions array.",
                },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const batchId = crypto.randomUUID();
        const now = new Date();

        // Prepare documents for insertion
        const docs = [];

        for (const t of transactions) {
            if (!t.amount || Number(t.amount) <= 0) continue;

            const type = t.type === "income" ? "income" : "expense";
            const categoryName = t.category || "Other";

            // Auto-create category if it doesn't exist (matches existing pattern)
            const existingCategory = await db.collection("categories").findOne({
                userId,
                name: categoryName,
                type,
            });

            let categoryId;
            if (!existingCategory) {
                const newCat = await db.collection("categories").insertOne({
                    userId,
                    name: categoryName,
                    type,
                    color: type === "income" ? "#10b981" : "#8b5cf6",
                    icon: type === "income" ? "📈" : "📉",
                    createdAt: now,
                    updatedAt: now,
                });
                categoryId = newCat.insertedId;
            } else {
                categoryId = existingCategory._id;
            }

            docs.push({
                userId,
                type,
                amount: Math.abs(Number(t.amount)),
                categoryId,
                category: categoryName,
                description: t.description || "",
                notes: "",
                date: t.date ? new Date(t.date) : now,
                source: "import",
                batchId,
                createdAt: now,
                updatedAt: now,
            });
        }

        if (docs.length === 0) {
            return NextResponse.json(
                { success: false, message: "No valid transactions to import." },
                { status: 400 }
            );
        }

        // Bulk insert
        const result = await db.collection("transactions").insertMany(docs);

        return NextResponse.json(
            {
                success: true,
                inserted: result.insertedCount,
                batchId,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/import/confirm error:", error);
        return NextResponse.json(
            { success: false, message: "Server error during import." },
            { status: 500 }
        );
    }
}
