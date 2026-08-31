'use server';

import Event from "@/database/event.model";
import connectDB from "../mongodb";
import { cacheLife } from "next/cache";

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
