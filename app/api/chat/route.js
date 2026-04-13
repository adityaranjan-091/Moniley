import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Helpers ──────────────────────────────────────────────────────────

async function fetchFinancialContext(db, userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Parallel fetches
    const [transactions, budgets, categories, goals] = await Promise.all([
        db.collection("transactions")
            .find({ userId })
            .sort({ date: -1 })
            .limit(50)
            .toArray(),
        db.collection("budgets").find({ userId }).toArray(),
        db.collection("categories").find({ userId }).toArray(),
        db.collection("goals").find({ userId }).toArray().catch(() => []),
    ]);

    // ── Monthly aggregates ──
    const monthlyTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= startOfMonth && d <= endOfMonth;
    });

    const monthlyIncome = monthlyTx
        .filter(t => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);

    const monthlyExpense = monthlyTx
        .filter(t => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);

    const netSavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0
        ? ((netSavings / monthlyIncome) * 100).toFixed(1)
        : "0.0";

    // ── All-time totals ──
    const allIncome = transactions
        .filter(t => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
    const allExpense = transactions
        .filter(t => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);

    // ── Budget status ──
    const spendingMap = {};
    monthlyTx
        .filter(t => t.type === "expense")
        .forEach(t => {
            const cat = t.category || "Uncategorized";
            spendingMap[cat] = (spendingMap[cat] || 0) + t.amount;
        });

    const budgetLines = budgets.map(b => {
        const spent = spendingMap[b.category] || 0;
        const pct = b.amount > 0 ? ((spent / b.amount) * 100).toFixed(0) : 0;
        const icon = pct > 100 ? "🔴" : pct > 75 ? "⚠️" : "✅";
        return `- ${b.category}: ₹${spent.toLocaleString("en-IN")}/₹${b.amount.toLocaleString("en-IN")} (${pct}%) ${icon}`;
    });

    // ── Category spending breakdown (this month) ──
    const expenseBreakdown = Object.entries(spendingMap)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `- ${cat}: ₹${amt.toLocaleString("en-IN")}`)
        .join("\n");

    // ── Recent transactions (up to 25) ──
    const recentTxLines = transactions.slice(0, 25).map((t, i) => {
        const d = new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const label = t.type === "income" ? "Income" : "Expense";
        return `${i + 1}. [${label}] ₹${t.amount.toLocaleString("en-IN")} - ${t.description || t.category} (${t.category}) - ${d}`;
    });

    // ── Goals ──
    const goalLines = goals.map(g => {
        const pct = g.targetAmount > 0
            ? ((g.currentAmount / g.targetAmount) * 100).toFixed(0)
            : 0;
        return `- ${g.name}: ₹${(g.currentAmount || 0).toLocaleString("en-IN")}/₹${g.targetAmount.toLocaleString("en-IN")} (${pct}%)`;
    });

    // ── Categories ──
    const incomeCategories = categories.filter(c => c.type === "income").map(c => c.name);
    const expenseCategories = categories.filter(c => c.type === "expense").map(c => c.name);

    const monthName = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

    return `
=== YOUR FINANCIAL SNAPSHOT ===

📊 Monthly Summary (${monthName}):
- Total Income: ₹${monthlyIncome.toLocaleString("en-IN")}
- Total Expenses: ₹${monthlyExpense.toLocaleString("en-IN")}
- Net Savings: ₹${netSavings.toLocaleString("en-IN")}
- Savings Rate: ${savingsRate}%

💰 All-Time Balance: ₹${(allIncome - allExpense).toLocaleString("en-IN")}

${budgetLines.length > 0 ? `🎯 Budget Status (This Month):\n${budgetLines.join("\n")}` : "🎯 No budgets configured yet."}

${expenseBreakdown ? `📉 Expense Breakdown (This Month):\n${expenseBreakdown}` : ""}

${goalLines.length > 0 ? `🏆 Savings Goals:\n${goalLines.join("\n")}` : ""}

📂 Income Categories: ${incomeCategories.length > 0 ? incomeCategories.join(", ") : "None"}
📂 Expense Categories: ${expenseCategories.length > 0 ? expenseCategories.join(", ") : "None"}

📋 Recent Transactions:
${recentTxLines.length > 0 ? recentTxLines.join("\n") : "No transactions yet."}
`.trim();
}

const SYSTEM_PROMPT = `You are **Moniley AI** — a friendly, expert personal financial advisor built into the Moniley finance tracker.

RULES:
1. You have access to the user's REAL financial data shown in the context block below. Use it to give **specific, personalized, actionable** advice.
2. Always reference actual numbers from their data when relevant.
3. Format responses with markdown for readability (bold, lists, tables when useful).
4. Use ₹ (Indian Rupees) for all currency values.
5. If asked about something not in the data, say so honestly.
6. Keep responses concise but insightful — aim for 100-300 words unless a detailed breakdown is requested.
7. Be encouraging but honest about concerning spending patterns.
8. When giving advice, consider the Indian financial context (UPI, mutual funds, FDs, tax-saving instruments etc.).
9. You can suggest creating budgets, setting goals, or adjusting spending habits based on their data.
10. Do NOT make up data. Only reference what you see in the financial snapshot.`;

// ── POST handler ─────────────────────────────────────────────────────

export async function POST(req) {
    try {
        const { message, userId, conversationId } = await req.json();

        if (!message || !userId) {
            return NextResponse.json(
                { success: false, message: "Missing message or userId" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // 1. Fetch financial context (RAG)
        const financialContext = await fetchFinancialContext(db, userId);

        // 2. Load or create conversation
        let conversation;
        if (conversationId) {
            conversation = await db.collection("chat_conversations").findOne({
                _id: new ObjectId(conversationId),
                userId,
            });
        }

        if (!conversation) {
            // Create fresh conversation
            const title = message.length > 60
                ? message.substring(0, 57) + "..."
                : message;
            const result = await db.collection("chat_conversations").insertOne({
                userId,
                title,
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            conversation = {
                _id: result.insertedId,
                userId,
                title,
                messages: [],
            };
        }

        // 3. Build messages array for Gemini
        const historyMessages = conversation.messages.slice(-20); // keep last 20 turns
        const geminiHistory = historyMessages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        // 4. Call Gemini with streaming
        const fullPrompt = `${SYSTEM_PROMPT}\n\n--- USER'S FINANCIAL DATA ---\n${financialContext}\n--- END FINANCIAL DATA ---\n\nUser's message: ${message}`;

        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: [
                ...geminiHistory,
                { role: "user", parts: [{ text: fullPrompt }] },
            ],
        });

        // 5. Stream the response
        let fullResponse = "";
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        const text = chunk.text || "";
                        if (text) {
                            fullResponse += text;
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                            );
                        }
                    }

                    // Save conversation turn after streaming completes
                    const now = new Date();
                    await db.collection("chat_conversations").updateOne(
                        { _id: conversation._id },
                        {
                            $push: {
                                messages: {
                                    $each: [
                                        { role: "user", content: message, timestamp: now },
                                        { role: "assistant", content: fullResponse, timestamp: now },
                                    ],
                                    $slice: -100, // Keep only the last 100 messages
                                },
                            },
                            $set: { updatedAt: now },
                        }
                    );

                    // Send done signal with conversationId
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ done: true, conversationId: conversation._id.toString() })}\n\n`
                        )
                    );
                    controller.close();
                } catch (err) {
                    console.error("Stream error:", err);
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`
                        )
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("POST /api/chat error:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
