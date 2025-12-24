import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, message: "Missing userId" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const user = await db.collection("users").findOne({ email: userId });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Gather stats
        const transactionCount = await db.collection("transactions").countDocuments({ userId });
        const budgetCount = await db.collection("budgets").countDocuments({ userId });

        // Calculate member since
        const memberSince = user.createdAt || user._id.getTimestamp(); // Fallback to ObjectId timestamp

        return NextResponse.json({
            success: true,
            data: {
                name: user.name,
                email: user.email,
                image: user.image,
                memberSince,
                transactionCount,
                budgetCount
            }
        });

    } catch (error) {
        console.error("GET /api/profile error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const { userId, name } = await req.json();

        if (!userId || !name) {
            return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        await db.collection("users").updateOne(
            { email: userId },
            { $set: { name } }
        );

        return NextResponse.json({ success: true, message: "Profile updated" });

    } catch (error) {
        console.error("PATCH /api/profile error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
