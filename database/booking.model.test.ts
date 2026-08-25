/**
 * Tests for database/booking.model.ts
 *
 * The pre('save') hook validates that the referenced event actually exists
 * by querying the database, and uniqueness is enforced by a real MongoDB
 * unique compound index. Both require a real database to exercise
 * faithfully, so these are integration tests backed by an in-memory MongoDB
 * instance (mongodb-memory-server) rather than pure unit tests.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Event from './event.model';
import Booking from './booking.model';

const createEvent = () =>
  Event.create({
    title: 'Sample Event',
    description: 'A sample event description.',
    overview: 'A sample event overview.',
    image: 'https://example.com/image.png',
    venue: 'Main Hall',
    location: 'Remote',
    date: '2026-10-01',
    time: '09:00',
    mode: 'online',
    audience: 'Everyone',
    agenda: ['Intro'],
    organizer: 'Org',
    tags: ['sample'],
  });

describe('Booking model', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all([Event.init(), Booking.init()]);
  });

  afterEach(async () => {
    await Promise.all([Booking.deleteMany({}), Event.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('validation', () => {
    it('creates a valid booking for an existing event', async () => {
      const event = await createEvent();
      const booking = await Booking.create({ eventId: event._id, email: 'user@example.com' });

      expect(booking._id).toBeDefined();
      expect(booking.eventId.toString()).toBe((event._id as Types.ObjectId).toString());
      expect(booking.email).toBe('user@example.com');
    });

    it('trims and lowercases the email address', async () => {
      const event = await createEvent();
      const booking = await Booking.create({
        eventId: event._id,
        email: '  User@Example.COM  ',
      });
      expect(booking.email).toBe('user@example.com');
    });

    it('rejects an invalid email address', async () => {
      const event = await createEvent();
      await expect(
        Booking.create({ eventId: event._id, email: 'not-an-email' })
      ).rejects.toThrow(/valid email address/);
    });

    it('rejects a booking without an eventId', async () => {
      await expect(
        Booking.create({ email: 'user@example.com' } as Record<string, unknown>)
      ).rejects.toThrow(/Event ID is required/);
    });

    it('rejects a booking without an email', async () => {
      const event = await createEvent();
      await expect(
        Booking.create({ eventId: event._id } as Record<string, unknown>)
      ).rejects.toThrow(/Email is required/);
    });

    it('rejects a booking that references a non-existent event', async () => {
      const fakeEventId = new Types.ObjectId();
      await expect(
        Booking.create({ eventId: fakeEventId, email: 'user@example.com' })
      ).rejects.toThrow(/Invalid events ID format or database error/);
    });
  });

  describe('uniqueness constraints', () => {
    it('rejects duplicate bookings for the same event and email', async () => {
      const event = await createEvent();
      await Booking.create({ eventId: event._id, email: 'duplicate@example.com' });

      await expect(
        Booking.create({ eventId: event._id, email: 'duplicate@example.com' })
      ).rejects.toThrow();
    });

    it('allows the same email to book different events', async () => {
      const eventOne = await createEvent();
      const eventTwo = await createEvent();

      await Booking.create({ eventId: eventOne._id, email: 'shared@example.com' });
      const secondBooking = await Booking.create({
        eventId: eventTwo._id,
        email: 'shared@example.com',
      });

      expect(secondBooking._id).toBeDefined();
    });

    it('allows different emails to book the same event', async () => {
      const event = await createEvent();

      await Booking.create({ eventId: event._id, email: 'first@example.com' });
      const secondBooking = await Booking.create({
        eventId: event._id,
        email: 'second@example.com',
      });

      expect(secondBooking._id).toBeDefined();
    });
  });

  describe('indexes', () => {
    it('defines an index on eventId', () => {
      const indexes = Booking.schema.indexes();
      const eventIdIndex = indexes.find(([def]) => def.eventId === 1 && !def.email);
      expect(eventIdIndex).toBeDefined();
    });

    it('defines a compound index on eventId and createdAt', () => {
      const indexes = Booking.schema.indexes();
      const compoundIndex = indexes.find(
        ([def]) => def.eventId === 1 && def.createdAt === -1
      );
      expect(compoundIndex).toBeDefined();
    });

    it('defines a unique compound index on eventId and email', () => {
      const indexes = Booking.schema.indexes();
      const uniqueIndex = indexes.find(([def]) => def.eventId === 1 && def.email === 1);
      expect(uniqueIndex).toBeDefined();
      expect(uniqueIndex?.[1]).toMatchObject({ unique: true, name: 'uniq_event_email' });
    });
  });
});