import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { userId, type, amount, category, date, description, notes } =
            await req.json();

        if (!userId || !amount || !type) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing required fields (userId, amount, type)",
                },
                { status: 400 }
            );
        }

        if (type !== "income" && type !== "expense") {
            return NextResponse.json(
                { success: false, message: "Invalid type. Must be 'income' or 'expense'" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        const transaction = {
            userId,
            type, // 'income' or 'expense'
            amount: Number(amount),
            category: category || "Uncategorized",
            description: description || "", // Unified field for Source/Description
            notes: notes || "",
            date: date ? new Date(date) : new Date(),
            createdAt: new Date(),
        };

        const result = await db.collection("transactions").insertOne(transaction);

        return NextResponse.json(
            { success: true, transaction: { ...transaction, _id: result.insertedId } },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/transactions error:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const type = url.searchParams.get("type"); // Optional filter

        const client = await clientPromise;
        const db = client.db();

        const query = {};
        if (userId) query.userId = userId;
        if (type) query.type = type;

        const transactions = await db
            .collection("transactions")
            .find(query)
            .sort({ date: -1, createdAt: -1 })
            .toArray();

        return NextResponse.json({ success: true, transactions }, { status: 200 });
    } catch (error) {
        console.error("GET /api/transactions error:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
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

        // Import ObjectId locally to avoid import errors if not standard
        const { ObjectId } = require('mongodb');

        const result = await db.collection("transactions").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            return NextResponse.json({ success: true, message: "Deleted" }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("DELETE /api/transactions error", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
