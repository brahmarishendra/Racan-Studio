import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './utils/db.js';
import mongoose from 'mongoose';

const PORT = Number(process.env.PORT) || 5000;
let MONGODB_URI = process.env.MONGODB_URI as string | undefined;
let DB_NAME = (process.env.DB_NAME as string | undefined) || 'brandkit';

async function main() {
  if (!MONGODB_URI) {
    console.warn('[DB] MONGODB_URI not set; falling back to mongodb://127.0.0.1:27017');
    MONGODB_URI = 'mongodb://127.0.0.1:27017';
  }
  await connectDB(MONGODB_URI, DB_NAME);
  // Ensure collections exist
  const requiredCollections = ['users', 'templates', 'projects'];
  await mongoose.connection.asPromise();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection not ready');
  }
  const existing = await db.listCollections().toArray();
  const existingNames = new Set(existing.map((c) => c.name));
  for (const name of requiredCollections) {
    if (!existingNames.has(name)) {
      await mongoose.connection.createCollection(name);
      console.log(`[DB] created collection: ${name}`);
    }
  }
  const app = createApp();
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

