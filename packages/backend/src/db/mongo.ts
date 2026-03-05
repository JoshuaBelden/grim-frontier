import { MongoClient } from "mongodb"

const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017/grim-frontier"

export const mongo = new MongoClient(uri)
export const db = mongo.db()

export async function connectMongo(): Promise<void> {
  await mongo.connect()
  console.log("MongoDB connected:", uri)
}

export async function closeMongo(): Promise<void> {
  await mongo.close()
}
