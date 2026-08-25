/**
 * Shared fixture representing a fully valid Event payload.
 * Used across event.model and booking.model test suites.
 */
export function buildValidEventData() {
  return {
    title: 'Intro to TypeScript',
    description:
      'A deep dive into TypeScript fundamentals for beginners and experienced developers alike.',
    overview: 'Learn TypeScript fundamentals in this hands-on session.',
    image: 'https://example.com/image.png',
    venue: 'Main Hall',
    location: 'New York, NY',
    date: '2026-09-15',
    time: '10:00',
    mode: 'offline' as const,
    audience: 'Developers',
    agenda: ['Welcome', 'Session 1', 'Q&A'],
    organizer: 'DevEvent Team',
    tags: ['typescript', 'programming'],
  };
}