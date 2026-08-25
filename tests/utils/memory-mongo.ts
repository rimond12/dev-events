import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;

/**
 * Starts an in-memory MongoDB instance and connects Mongoose to it.
 * Intended for use in `beforeAll` within integration-style model tests.
 */
export async function connectTestDB(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

/**
 * Disconnects Mongoose and stops the in-memory MongoDB instance.
 * Intended for use in `afterAll`.
 */
export async function disconnectTestDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

/**
 * Removes all documents from every registered collection.
 * Intended for use in `afterEach` to keep tests isolated from one another.
 */
export async function clearTestDB(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}