import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

import connectDB from "@/lib/mongodb";
import Event from '@/database/event.model';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/events
 * Creates a new event with image upload to Cloudinary.
 * Accepts FormData with event details and an image file.
 * @param req - The Next.js request object containing FormData
 * @returns JSON response with created event or error message
 */
export async function POST(req: NextRequest) {
    // DEBUG: remove after fixing
    console.log('[Cloudinary Config]', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.slice(0, 4) + '...' : 'MISSING',
        api_secret: process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.slice(0, 4) + '...' : 'MISSING',
    });
    try {
        await connectDB();

        const formData = await req.formData();

        let event;

        try {
            event = Object.fromEntries(formData.entries());
        } catch (error) {
            return NextResponse.json({ message: 'Invalid JSON data format' }, { status: 400 })
        }

        //Cloudinary upload file 
        const file = formData.get('image') as File | null;

        if (!file) return NextResponse.json({ message: 'Image is required' }, { status: 400 });


        let tags = JSON.parse(formData.get('tags') as string);
        let agenda = JSON.parse(formData.get('agenda') as string);


        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if (error) return reject(error);

                resolve(results);
            }).end(buffer);
        });

        event.image = (uploadResult as { secure_url: string }).secure_url;

        //Created Event 
        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });
        return NextResponse.json({ message: 'Event Created Successfully', event: createdEvent }, { status: 201 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: 'Event Created Failed', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

/**
 * GET /api/events
 * Retrieves all events from the database, sorted by creation date (newest first).
 * @returns JSON response with array of events or error message
 */
export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events Fetched Successfully', events }, { status: 200 });

    } catch (e) {
        return NextResponse.json({ message: 'Failed to Fetch Events' }, { status: 500 });
    }
}