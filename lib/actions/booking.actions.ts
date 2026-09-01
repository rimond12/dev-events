'use server';

import Booking from "@/database/booking.model";
import connectDB from "../mongodb"

export const createBooking = async ({ eventId, email }: { eventId: string, email: string }) => {
    try {
        await connectDB();
        await Booking.create({ eventId, email });
        return { success: true };


    } catch (error) {
        return {
            success: false,
            error
        }
    }
}