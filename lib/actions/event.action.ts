'use server';

import Event from "@/database/event.model";
import connectDB from "../mongodb";
import { cacheLife } from "next/cache";

/**
 * Retrieves events similar to the one with the given slug.
 * Similarity is based on shared tags.
 * @param slug - The slug of the event to find similar events for
 * @returns Array of similar events (serialized for client components), or empty array on error
 */
export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        await connectDB();
        const event = await Event.findOne({ slug }).lean();

        const events = await Event.find({ _id: { $ne: event!._id }, tags: { $in: event!.tags } }).lean();

        // Fully serialize: ObjectId, Date, etc. are NOT plain objects and
        // cannot be passed from Server → Client Components as-is.
        return JSON.parse(JSON.stringify(events));

    } catch (e) {
        return [];
    }
}

/**
 * Retrieves all events from the database, sorted by creation date (newest first).
 * Results are cached for one hour.
 * @returns Array of all events (serialized for client components), or empty array on error
 */
export const getAllEvents = async () => {
    'use cache'
    cacheLife('hours')

    try {
        await connectDB();
        const events = await Event.find().sort({ createdAt: -1 }).lean();
        return JSON.parse(JSON.stringify(events));
    } catch (e) {
        return [];
    }
}
