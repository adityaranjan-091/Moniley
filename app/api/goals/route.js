import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

/** @typedef {import('@/lib/types').Goal} Goal */

export async function POST(req) {
  try {
    const { userId, name, targetAmount, currentAmount } = await req.json();

    if (!userId || !name || targetAmount === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const goal = {
      userId,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("goals").insertOne(goal);

    return NextResponse.json(
      { success: true, goal: { ...goal, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/goals error:", error);
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

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const goals = await db.collection("goals").find({ userId }).toArray();

    return NextResponse.json({ success: true, goals }, { status: 200 });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { _id, userId, name, targetAmount, currentAmount } = await req.json();

    if (!_id || !userId) {
      return NextResponse.json(
        { success: false, message: "Missing _id or userId" },
        { status: 400 }
      );
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (targetAmount !== undefined) updateFields.targetAmount = Number(targetAmount);
    if (currentAmount !== undefined) updateFields.currentAmount = Number(currentAmount);
    updateFields.updatedAt = new Date();

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("goals").updateOne(
      { _id: new ObjectId(_id), userId },
      { $set: updateFields }
    );

    if (result.matchedCount === 1) {
      return NextResponse.json({ success: true, message: "Goal updated" }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("PATCH /api/goals error:", error);
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

    const result = await db.collection("goals").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true, message: "Deleted" }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("DELETE /api/goals error", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
