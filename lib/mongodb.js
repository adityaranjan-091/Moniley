import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add MONGODB_URI to .env.local");
}

async function setupDatabase(db) {
  try {
    // 1. Setup collections and indexes
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Ensure collections exist
    const requiredCollections = [
      "users",
      "transactions",
      "categories",
      "budgets",
      "goals",
      "chat_conversations",
    ];

    for (const name of requiredCollections) {
      if (!collectionNames.includes(name)) {
        await db.createCollection(name);
      }
    }

    // 2. Create Indexes
    await Promise.all([
      // Users
      db.collection("users").createIndex({ email: 1 }, { unique: true }),

      // Transactions
      db.collection("transactions").createIndex({ userId: 1, date: -1 }),
      db.collection("transactions").createIndex({ userId: 1, type: 1 }),
      db.collection("transactions").createIndex({ categoryId: 1 }),

      // Categories
      db.collection("categories").createIndex({ userId: 1, type: 1 }),

      // Budgets
      db.collection("budgets").createIndex({ userId: 1, categoryId: 1 }, { unique: true }),

      // Goals
      db.collection("goals").createIndex({ userId: 1 }),

      // Chat
      db.collection("chat_conversations").createIndex({ userId: 1, updatedAt: -1 }),
    ]);

    console.log("MongoDB indexes and collections verified.");
  } catch (err) {
    console.error("Failed to setup MongoDB indexes:", err);
  }
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().then(async (c) => {
      await setupDatabase(c.db());
      return c;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect().then(async (c) => {
    await setupDatabase(c.db());
    return c;
  });
}

export default clientPromise;
