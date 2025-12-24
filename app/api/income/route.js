import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId, amount, source, date, notes } = await req.json();

    if (!userId || amount == null || !source) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields (userId, amount, source)",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const income = {
      userId,
      amount: Number(amount),
      source,
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
      createdAt: new Date(),
    };

    const result = await db.collection("incomes").insertOne(income);

    return NextResponse.json(
      { success: true, income: { ...income, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/income error:", error);
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

    const client = await clientPromise;
    const db = client.db();

    const query = {};
    if (userId) query.userId = userId;

    const incomes = await db
      .collection("incomes")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, incomes }, { status: 200 });
  } catch (error) {
    console.error("GET /api/income error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
