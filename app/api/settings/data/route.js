import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function DELETE(req) {
    try {
        const { userId } = await req.json();
        const url = new URL(req.url);
        const type = url.searchParams.get("type"); // reset | account

        if (!userId) {
            return NextResponse.json({ success: false, message: "Missing userId" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        if (type === 'reset') {
            // Delete all user related data but keep user
            await Promise.all([
                db.collection("transactions").deleteMany({ userId }),
                db.collection("budgets").deleteMany({ userId }),
                db.collection("goals").deleteMany({ userId }),
                db.collection("categories").deleteMany({ userId, isDefault: { $ne: true } }) // Keep defaults if any
            ]);
            return NextResponse.json({ success: true, message: "Data reset successfully" });
        } else if (type === 'account') {
            // Delete everything including user
            await Promise.all([
                db.collection("users").deleteOne({ email: userId }),
                db.collection("transactions").deleteMany({ userId }),
                db.collection("budgets").deleteMany({ userId }),
                db.collection("goals").deleteMany({ userId }),
                db.collection("categories").deleteMany({ userId })
            ]);
            return NextResponse.json({ success: true, message: "Account deleted successfully" });
        }

        return NextResponse.json({ success: false, message: "Invalid type" }, { status: 400 });

    } catch (error) {
        console.error("DELETE /api/settings/data error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
