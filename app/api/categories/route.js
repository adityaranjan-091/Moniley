import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(req) {
    try {
        const { userId, name, type, color, icon } = await req.json();

        if (!userId || !name || !type) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        const category = {
            userId,
            name,
            type, // 'income' or 'expense'
            color: color || "#000000",
            icon: icon || "🪙",
            createdAt: new Date(),
        };

        const result = await db.collection("categories").insertOne(category);

        return NextResponse.json(
            { success: true, category: { ...category, _id: result.insertedId } },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/categories error:", error);
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
        const type = url.searchParams.get("type");

        const client = await clientPromise;
        const db = client.db();

        const query = {};
        if (userId) query.userId = userId;
        if (type) query.type = type;

        const categories = await db
            .collection("categories")
            .find(query)
            .sort({ name: 1 })
            .toArray();

        return NextResponse.json({ success: true, categories }, { status: 200 });
    } catch (error) {
        console.error("GET /api/categories error:", error);
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

        const result = await db.collection("categories").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            return NextResponse.json({ success: true, message: "Deleted" }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
        }
    } catch (error) {
        console.error("DELETE /api/categories error", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
