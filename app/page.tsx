import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
const events = [
    {
        image: '/images/event1.png',
        tittle: 'Event 1',
        slug: 'event-1',
        location: 'Location-1',
        date: 'Date-1',
        time: 'Time-1',
    },
    {image: '/images/event2.png', tittle: 'Event 2'},
]
const Page = () => {
    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br/> Event you can't Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups and Conferences, All in One Place</p>

            <ExploreBtn />
            <div className="mt-20 space-y-7 ">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events.map((event) =>(
                        <li key={event.tittle}>

                        <EventCard {...event} />
                        </li>
                    ))}

                </ul>
            </div>
        </section>
    )
}
export default Page
