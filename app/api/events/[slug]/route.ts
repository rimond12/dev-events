import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Event from '@/database/event.model';
import type { IEvent } from '@/database';

/**
 * GET /api/events/[slug]
 * Returns a single event document matching the provided slug.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
    try {
        // In Next.js 15+, route params are a Promise — must be awaited.
        const { slug } = await params;

        // Validate that slug is a non-empty string
        if (!slug || typeof slug !== 'string' || slug.trim() === '') {
            return NextResponse.json(
                { message: 'Invalid or missing slug parameter' },
                { status: 400 }
            );
        }

        await connectDB();

        // Query the database for the event
        const event: IEvent | null = await Event.findOne({ slug: slug.trim() });

        // Return 404 if no matching event was found
        if (!event) {
            return NextResponse.json(
                { message: `No event found with slug: "${slug}"` },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Event fetched successfully', event },
            { status: 200 }
        );

    } catch (error) {
        console.error('[GET /api/events/[slug]]', error);
        return NextResponse.json(
            {
                message: 'Failed to fetch event',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
