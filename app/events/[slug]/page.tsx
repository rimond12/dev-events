import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database";
import { getEventBySlug, getSimilarEventsBySlug } from "@/lib/actions/event.action";
import { cacheLife } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * Displays a single detail item (icon + label) for event information.
 * @param props - Icon path, alt text, and label text
 * @returns React component
 */
const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string }) => (
    <div className="flex-row-gap-2 items-center">
        <Image src={icon} alt={alt} width={20} height={20} />
        <p>{label}</p>
    </div>
)

/**
 * Displays the event agenda as a list of items.
 * @param props - Object containing array of agenda items
 * @returns React component
 */
const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
    <section className="agenda flex-col gap-2 mt-4">
        <h2>Event Agenda</h2>
        <ul>
            {agendaItems.map((item: string) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    </section>
)

/**
 * Displays event tags as styled pills/badges.
 * @param props - Object containing array of tag strings
 * @returns React component
 */
const EventTags = ({ tags }: { tags: string[] }) => (
    <div>
        <h2>Tags</h2>
        <div className="flex flex-row gap-1.5 flex-wrap">
            {tags.map((tag: string) => (
                <div className="pill" key={tag}>{tag}</div>
            ))}
        </div>
    </div>
)

/**
 * Event details page - Displays comprehensive information about a single event.
 * Shows event description, overview, details, agenda, organizer info, booking form, and similar events.
 * @param props - Object containing params promise with event slug
 * @returns React component
 */
const EventsDetailsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
    'use cache';
    cacheLife('hours')

    const { slug } = await params;
    const event = await getEventBySlug(slug);
    if (!event) return notFound();

    const { description, image, overview, date, time, location, mode, agenda, audience, tags, organizer } = event;

    const bookings = 10;

    const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);
    console.log('similarEvents:', similarEvents);


    return (
        <section id="event">
            <div className="header">
                <h1>Event Descriptionn</h1>
                <p>{description}</p>
            </div>
            <div className="details">

                {/* Left side - Event Content */}
                <div className="content">
                    <Image src={image} alt="Event Banner" width={800} height={800} className="banner" />

                    <section className="flex-col gap-2">
                        <h2>Overview</h2>
                        <p>{overview}</p>
                    </section>

                    <section className="flex-col gap-2 mt-4">
                        <h2>Event Details</h2>

                        <EventDetailItem icon="/icons/calendar.svg" alt="calender" label={date} />

                        <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />

                        <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />

                        <EventDetailItem icon="/icons/mode.svg" alt="mode " label={mode} />

                        <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />

                    </section>

                    <section>
                        <EventAgenda agendaItems={agenda} />
                    </section>

                    <section className="flex-c-gap-2 mt-4">
                        <h2>About the Organizer</h2>
                        <p>{organizer}</p>
                    </section>

                    <EventTags tags={tags} />


                </div>

                {/* Right side - Booking Form */}
                <aside className="booking">
                    <div className="signup-card">
                        <h2>Book Your Spot</h2>
                        {bookings > 0 ? (
                            <p className="text-sm">
                                Join {bookings} people who have already booked their spot!
                            </p>
                        ) : (
                            <p className="text-sm">Be the first to book your spot!</p>
                        )}
                        <BookEvent eventId={event._id} slug={event.slug} />
                    </div>
                </aside>

            </div>

            <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="events">
                    {similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
                        <EventCard key={similarEvent.slug} {...similarEvent} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default EventsDetailsPage;