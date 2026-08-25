/**
 * Tests for database/event.model.ts
 *
 * The slug/date/time normalization logic lives inside a Mongoose
 * `pre('save')` hook, and uniqueness is enforced by a real MongoDB unique
 * index. Both can only be exercised faithfully by actually persisting
 * documents, so these are integration tests backed by an in-memory MongoDB
 * instance (mongodb-memory-server) rather than pure unit tests.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Event from './event.model';

type EventInput = Record<string, unknown>;

const baseEventData = (): EventInput => ({
  title: 'Annual Tech Conference',
  description: 'A conference about technology trends and innovation.',
  overview: 'Join us for a day of talks and networking.',
  image: 'https://example.com/image.png',
  venue: 'Grand Hall',
  location: 'New York, NY',
  date: '2026-09-15',
  time: '10:00',
  mode: 'offline',
  audience: 'Developers',
  agenda: ['Opening remarks', 'Keynote'],
  organizer: 'Tech Org',
  tags: ['tech', 'conference'],
});

describe('Event model', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Event.init();
  });

  afterEach(async () => {
    await Event.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('validation', () => {
    it('creates a valid event when all required fields are present', async () => {
      const event = await Event.create(baseEventData());
      expect(event._id).toBeDefined();
      expect(event.title).toBe('Annual Tech Conference');
    });

    it.each([
      'title',
      'description',
      'overview',
      'image',
      'venue',
      'location',
      'date',
      'time',
      'mode',
      'audience',
      'organizer',
    ])('fails validation when %s is missing', async (field) => {
      const data = baseEventData();
      delete data[field];
      await expect(Event.create(data)).rejects.toThrow();
    });

    it('rejects a title longer than 100 characters', async () => {
      const data = { ...baseEventData(), title: 'a'.repeat(101) };
      await expect(Event.create(data)).rejects.toThrow(/cannot exceed 100 characters/);
    });

    it('rejects a description longer than 1000 characters', async () => {
      const data = { ...baseEventData(), description: 'a'.repeat(1001) };
      await expect(Event.create(data)).rejects.toThrow(/cannot exceed 1000 characters/);
    });

    it('rejects an overview longer than 500 characters', async () => {
      const data = { ...baseEventData(), overview: 'a'.repeat(501) };
      await expect(Event.create(data)).rejects.toThrow(/cannot exceed 500 characters/);
    });

    it('rejects an invalid mode value', async () => {
      const data = { ...baseEventData(), mode: 'virtual' };
      await expect(Event.create(data)).rejects.toThrow(
        /Mode must be either online, offline, or hybrid/
      );
    });

    it.each(['online', 'offline', 'hybrid'])('accepts a valid mode value: %s', async (mode) => {
      const event = await Event.create({ ...baseEventData(), mode });
      expect(event.mode).toBe(mode);
    });

    it('rejects an empty agenda array', async () => {
      const data = { ...baseEventData(), agenda: [] };
      await expect(Event.create(data)).rejects.toThrow(/At least one agenda item is required/);
    });

    it('rejects an empty tags array', async () => {
      const data = { ...baseEventData(), tags: [] };
      await expect(Event.create(data)).rejects.toThrow(/At least one tag is required/);
    });
  });

  describe('slug generation', () => {
    it('generates a url-friendly slug from the title on creation', async () => {
      const event = await Event.create({
        ...baseEventData(),
        title: 'Node.js & TypeScript: Best Practices!',
      });
      expect(event.slug).toBe('nodejs-typescript-best-practices');
    });

    it('collapses whitespace and strips special characters from the slug', async () => {
      const event = await Event.create({
        ...baseEventData(),
        title: '  Multiple   Spaces --- and $$$ symbols  ',
      });
      expect(event.slug).toBe('multiple-spaces-and-symbols');
      expect(event.slug).not.toMatch(/^-|-$/);
      expect(event.slug).not.toContain('--');
    });

    it('regenerates the slug when the title is modified', async () => {
      const event = await Event.create(baseEventData());
      event.title = 'A Brand New Title';
      await event.save();
      expect(event.slug).toBe('a-brand-new-title');
    });

    it('does not regenerate the slug when the title is unchanged', async () => {
      const event = await Event.create(baseEventData());
      const originalSlug = event.slug;
      event.location = 'San Francisco, CA';
      await event.save();
      expect(event.slug).toBe(originalSlug);
    });

    it('enforces slug uniqueness at the database level', async () => {
      await Event.create({ ...baseEventData(), title: 'Duplicate Title Event' });
      await expect(
        Event.create({ ...baseEventData(), title: 'Duplicate Title Event' })
      ).rejects.toThrow();
    });
  });

  describe('date normalization', () => {
    it('normalizes a date string to YYYY-MM-DD format', async () => {
      const event = await Event.create({
        ...baseEventData(),
        date: '2026-09-15T00:00:00.000Z',
      });
      expect(event.date).toBe('2026-09-15');
    });

    it('throws for an invalid date string', async () => {
      const data = { ...baseEventData(), date: 'not-a-real-date' };
      await expect(Event.create(data)).rejects.toThrow(/Invalid date format/);
    });
  });

  describe('time normalization', () => {
    it('keeps a 24-hour HH:MM time unchanged', async () => {
      const event = await Event.create({ ...baseEventData(), time: '14:30' });
      expect(event.time).toBe('14:30');
    });

    it('converts a 12-hour PM time to 24-hour format', async () => {
      const event = await Event.create({ ...baseEventData(), time: '2:30 PM' });
      expect(event.time).toBe('14:30');
    });

    it('converts a 12-hour AM time to 24-hour format', async () => {
      const event = await Event.create({ ...baseEventData(), time: '1:15 AM' });
      expect(event.time).toBe('01:15');
    });

    it('normalizes 12:00 AM (midnight) to 00:00', async () => {
      const event = await Event.create({ ...baseEventData(), time: '12:00 AM' });
      expect(event.time).toBe('00:00');
    });

    it('normalizes 12:00 PM (noon) to 12:00', async () => {
      const event = await Event.create({ ...baseEventData(), time: '12:00 PM' });
      expect(event.time).toBe('12:00');
    });

    it('throws for an out-of-range time value', async () => {
      const data = { ...baseEventData(), time: '99:99' };
      await expect(Event.create(data)).rejects.toThrow(/Invalid time (format|values)/);
    });

    it('throws for a malformed time string', async () => {
      const data = { ...baseEventData(), time: 'not-a-time' };
      await expect(Event.create(data)).rejects.toThrow(/Invalid time format/);
    });
  });

  describe('indexes', () => {
    it('defines a unique index on slug', () => {
      const indexes = Event.schema.indexes();
      const slugIndex = indexes.find(([def]) => def.slug === 1);
      expect(slugIndex).toBeDefined();
      expect(slugIndex?.[1]).toMatchObject({ unique: true });
    });

    it('defines a compound index on date and mode', () => {
      const indexes = Event.schema.indexes();
      const compoundIndex = indexes.find(([def]) => def.date === 1 && def.mode === 1);
      expect(compoundIndex).toBeDefined();
    });
  });
});