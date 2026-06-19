import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extract text content from a PDF buffer using unpdf.
 * unpdf works server-side without canvas/DOMMatrix dependencies.
 */
async function extractPdfText(buffer) {
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    return text;
}

/**
 * Extract rows from CSV / Excel buffer using xlsx (SheetJS).
 * Returns a single string representation of all rows for Gemini.
 */
async function extractSpreadsheetText(buffer) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let allText = "";
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to CSV text — preserves structure for Gemini
        const csv = XLSX.utils.sheet_to_csv(sheet);
        allText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
    }
    return allText;
}

/**
 * Determine file type from name/mime.
 */
function getFileType(fileName, mimeType) {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
    if (ext === "csv" || mimeType === "text/csv") return "csv";
    if (
        ext === "xlsx" ||
        ext === "xls" ||
        mimeType ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimeType === "application/vnd.ms-excel"
    )
        return "excel";
    return null;
}

// ── Route Handler ───────────────────────────────────────────────────

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const userId = formData.get("userId");

        if (!file || !userId) {
            return NextResponse.json(
                { success: false, message: "Missing file or userId" },
                { status: 400 }
            );
        }

        const fileName = file.name;
        const mimeType = file.type;
        const fileType = getFileType(fileName, mimeType);

        if (!fileType) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unsupported file type. Please upload a PDF, CSV, or Excel file.",
                },
                { status: 400 }
            );
        }

        // Read file into buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text based on file type
        let extractedText = "";
        if (fileType === "pdf") {
            extractedText = await extractPdfText(buffer);
        } else {
            // csv or excel — both handled by xlsx
            extractedText = await extractSpreadsheetText(buffer);
        }

        if (!extractedText || extractedText.trim().length < 10) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Could not extract meaningful text from the file. The file may be empty or image-based.",
                },
                { status: 422 }
            );
        }

        // Truncate to ~15000 chars to stay within Gemini context limits
        const truncatedText = extractedText.slice(0, 15000);

        // Fetch user's existing categories for context
        const client = await clientPromise;
        const db = client.db();
        const categories = await db
            .collection("categories")
            .find({ userId })
            .toArray();

        const expenseCategories = categories
            .filter((c) => c.type === "expense")
            .map((c) => c.name);
        const incomeCategories = categories
            .filter((c) => c.type === "income")
            .map((c) => c.name);

        // Build Gemini prompt
        const prompt = `You are a financial data extraction expert. 
Analyze the following text extracted from a transaction statement file (could be a UPI statement, bank statement, or any financial document).

EXTRACTED TEXT:
"""
${truncatedText}
"""

USER'S EXISTING EXPENSE CATEGORIES: ${expenseCategories.length > 0 ? expenseCategories.join(", ") : "None yet"}
USER'S EXISTING INCOME CATEGORIES: ${incomeCategories.length > 0 ? incomeCategories.join(", ") : "None yet"}

INSTRUCTIONS:
1. Extract ALL individual transactions from the text.
2. For each transaction, determine:
   - "date": in YYYY-MM-DD format. If year is missing, assume ${new Date().getFullYear()}.
   - "description": a clean, short description (e.g., "Swiggy Order" not "SWIGGY*ORDER-123456789")
   - "amount": numeric value only, NO currency symbols. Must be positive.
   - "type": either "income" or "expense". Credits/deposits/received = income. Debits/payments/sent = expense.
   - "category": Map to the user's existing categories where possible. If none fit, create a logical category name in Title Case (e.g., "Food & Dining", "Transportation", "Salary", "Freelance").
3. Ignore non-transaction rows like headers, footers, balances, summaries, account details.
4. If you cannot extract any transactions, return an empty array.

Return ONLY a valid JSON array. No markdown, no explanation. Example:
[{"date":"2025-06-10","description":"Swiggy Order","amount":450,"type":"expense","category":"Food & Dining"}]`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        if (!response.text) {
            return NextResponse.json(
                { success: false, message: "No response from Gemini API" },
                { status: 500 }
            );
        }

        let transactions;
        try {
            transactions = JSON.parse(response.text);
        } catch (_e) {
            console.error("Failed to parse Gemini response:", response.text);
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Failed to parse the AI response. The file format may not be supported.",
                },
                { status: 500 }
            );
        }

        // Validate it's an array
        if (!Array.isArray(transactions)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unexpected AI response format.",
                },
                { status: 500 }
            );
        }

        // Sanitize each transaction
        const sanitized = transactions
            .map((t, index) => ({
                _tempId: `import-${index}`,
                date: t.date || new Date().toISOString().slice(0, 10),
                description: String(t.description || "").slice(0, 200),
                amount: Math.abs(Number(t.amount) || 0),
                type: t.type === "income" ? "income" : "expense",
                category: String(t.category || "Other").slice(0, 50),
                selected: true, // default to selected for the preview
            }))
            .filter((t) => t.amount > 0); // drop zero-amount rows

        return NextResponse.json(
            {
                success: true,
                transactions: sanitized,
                meta: {
                    fileName,
                    fileType,
                    totalExtracted: sanitized.length,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("POST /api/import/parse error:", error);
        return NextResponse.json(
            { success: false, message: "Server error during file parsing." },
            { status: 500 }
        );
    }
}
