import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Missing fields" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const existingUser = await db.collection("users").findOne({ email });

  if (existingUser) {
    return NextResponse.json(
      { success: false, message: "User already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.collection("users").insertOne({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date(),
  });

  return NextResponse.json(
    { success: true, message: "User registered" },
    { status: 201 }
  );
}
