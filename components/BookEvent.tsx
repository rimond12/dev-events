'use client';

import { useState } from "react";

/**
 * BookEvent component - Displays a form for users to book/register for an event.
 * Shows a thank you message after submission.
 * @returns React component
 */
const BookEvent = () => {

    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setTimeout(() => {
            setSubmitted(true);
        }, 1000);
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
