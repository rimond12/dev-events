'use client';

import { createBooking } from "@/lib/actions/booking.actions";
import posthog from "posthog-js";
import { useState } from "react";

/**
 * BookEvent component - Displays a form for users to book/register for an event.
 * Shows a thank you message after submission.
 * @returns React component
 */
const BookEvent = ({ eventId, slug }: { eventId: string, slug: string }) => {

    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { success, error } = await createBooking({ eventId, email });

        if (success) {
            setSubmitted(true);
            posthog.capture("Booking Created", {
                event_id: eventId,
                event_slug: slug,
                email
            })

        } else {
            console.log(error);
            posthog.capture("Booking Failed", {
                event_id: eventId,
                event_slug: slug,
                email,
                error
            })
        }

    }

    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm">Thank you signing up!</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">Email Adress</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Enter your email adress"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        className="border border-gray-300 rounded-md p-2" />


                    <button type="submit" className="button-submit">Submit</button>
                </form>
            )
            }
        </div>
    );
}

export default BookEvent;
