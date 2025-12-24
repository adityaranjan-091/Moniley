import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        const { userId, currentPassword, newPassword } = await req.json();

        if (!userId || !currentPassword || !newPassword) {
            return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const user = await db.collection("users").findOne({ email: userId });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ success: false, message: "Incorrect current password" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.collection("users").updateOne(
            { email: userId },
            { $set: { password: hashedPassword } }
        );

        return NextResponse.json({ success: true, message: "Password updated" });

    } catch (error) {
        console.error("POST /api/settings/password error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
