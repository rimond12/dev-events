import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database";
import { getSimilarEventsBySlug } from "@/lib/actions/event.action";
import { log } from "console";
import Image from "next/image";
import { notFound } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string }) => (
    <div className="flex-row-gap-2 items-center">
        <Image src={icon} alt={alt} width={20} height={20} />
        <p>{label}</p>
    </div>
)

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

const EventsDetailsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {

    const { slug } = await params;
    const request = await fetch(`${BASE_URL}/api/events/${slug}`);
    const { event: { description, image, overview, date, time, location, mode, agenda, audience, tags, organizer } } = await request.json();

    if (!description) return notFound();

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
                        <BookEvent />
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