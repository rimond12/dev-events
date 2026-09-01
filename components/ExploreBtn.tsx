'use client';

import Image from "next/image";
import posthog from "posthog-js";

/**
 * ExploreBtn component - Button that scrolls to the events section.
 * Tracks user interaction via PostHog analytics.
 * @returns React component
 */
const ExploreBtn = () => {
    const handleExplore = () => {
        posthog.capture("events_explored");
    };

    return (
        <button typeof="button" id="explore-btn" className="mt-7 mx-auto" onClick={handleExplore}>
            <a href="#events">
                Explore Events
                <Image src="/icons/arrow-down.svg" alt="arrow-down" width={24} height={24} style={{ height: 'auto' }} />
            </a>
        </button>
    )
}
export default ExploreBtn;
