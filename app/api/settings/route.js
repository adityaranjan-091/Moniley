import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function PATCH(req) {
    try {
        const { userId, notifications, general } = await req.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: "Missing userId" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Construct update object
        const updateDoc = {};
        if (notifications) updateDoc.notifications = notifications;
        if (general) updateDoc.general = general;

        const result = await db.collection("users").updateOne(
            { email: userId },
            { $set: { settings: updateDoc } },
            { upsert: true } // Create if not exists logic might need refinement depending on Auth
        );

        return NextResponse.json({ success: true, message: "Settings updated" });

    } catch (error) {
        console.error("PATCH /api/settings error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
