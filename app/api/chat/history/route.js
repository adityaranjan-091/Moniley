import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const conversationId = url.searchParams.get("conversationId");

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Missing userId" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        if (conversationId) {
            // Return full conversation
            const conversation = await db
                .collection("chat_conversations")
                .findOne({
                    _id: new ObjectId(conversationId),
                    userId,
                });

            if (!conversation) {
                return NextResponse.json(
                    { success: false, message: "Conversation not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { success: true, conversation },
                { status: 200 }
            );
        }

        // Return list of conversations (titles + IDs only)
        const conversations = await db
            .collection("chat_conversations")
            .find({ userId })
            .project({ title: 1, createdAt: 1, updatedAt: 1 })
            .sort({ updatedAt: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json(
            { success: true, conversations },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/chat/history error:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// DELETE — Remove a conversation
export async function DELETE(req) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Missing conversation id" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        const result = await db
            .collection("chat_conversations")
            .deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            return NextResponse.json(
                { success: true, message: "Deleted" },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { success: false, message: "Not found" },
            { status: 404 }
        );
    } catch (error) {
        console.error("DELETE /api/chat/history error:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
