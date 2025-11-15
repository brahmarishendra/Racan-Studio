import mongoose from 'mongoose';

export async function connectDB(uri: string, dbName?: string) {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, {
    dbName: dbName || process.env.DB_NAME,
  } as any);
  const name = mongoose.connection.name;
  console.log(`[DB] connected to ${name}`);
}
