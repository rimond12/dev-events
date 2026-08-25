import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import Event from './event.model';
import { buildValidEventData } from '../tests/fixtures/event-data';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../tests/utils/memory-mongo';

describe('Event model - schema validation (no DB required)', () => {
  it('passes validation for a fully valid event', () => {
    const event = new Event(buildValidEventData());
    const err = event.validateSync();
    expect(err).toBeUndefined();
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
    'agenda',
    'organizer',
    'tags',
  ])('fails validation when %s is missing', (field) => {
    const data = buildValidEventData() as Record<string, unknown>;
    delete data[field];
    const event = new Event(data);
    const err = event.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors[field]).toBeDefined();
  });

  it('fails validation when agenda is an empty array', () => {
    const event = new Event({ ...buildValidEventData(), agenda: [] });
    const err = event.validateSync();
    expect(err?.errors.agenda).toBeDefined();
    expect(err?.errors.agenda.message).toBe('At least one agenda item is required');
  });

  it('fails validation when tags is an empty array', () => {
    const event = new Event({ ...buildValidEventData(), tags: [] });
    const err = event.validateSync();
    expect(err?.errors.tags).toBeDefined();
    expect(err?.errors.tags.message).toBe('At least one tag is required');
  });

  it('fails validation when title exceeds 100 characters', () => {
    const event = new Event({ ...buildValidEventData(), title: 'a'.repeat(101) });
    const err = event.validateSync();
    expect(err?.errors.title).toBeDefined();
  });

  it('accepts a title of exactly 100 characters', () => {
    const event = new Event({ ...buildValidEventData(), title: 'a'.repeat(100) });
    const err = event.validateSync();
    expect(err).toBeUndefined();
  });

  it('fails validation when description exceeds 1000 characters', () => {
    const event = new Event({ ...buildValidEventData(), description: 'a'.repeat(1001) });
    const err = event.validateSync();
    expect(err?.errors.description).toBeDefined();
  });

  it('fails validation when overview exceeds 500 characters', () => {
    const event = new Event({ ...buildValidEventData(), overview: 'a'.repeat(501) });
    const err = event.validateSync();
    expect(err?.errors.overview).toBeDefined();
  });

  it('fails validation when mode is not one of the allowed enum values', () => {
    const event = new Event({ ...buildValidEventData(), mode: 'virtual' });
    const err = event.validateSync();
    expect(err?.errors.mode).toBeDefined();
  });

  it.each(['online', 'offline', 'hybrid'])('accepts "%s" as a valid mode', (mode) => {
    const event = new Event({ ...buildValidEventData(), mode });
    const err = event.validateSync();
    expect(err).toBeUndefined();
  });
});

describe('Event model - registered indexes', () => {
  it('defines a unique index on slug', () => {
    const indexes = Event.schema.indexes();
    const slugIndex = indexes.find(([def]) => def.slug === 1);
    expect(slugIndex).toBeDefined();
    expect(slugIndex?.[1]).toMatchObject({ unique: true });
  });

  it('defines a compound index on date and mode', () => {
    const indexes = Event.schema.indexes();
    const compound = indexes.find(([def]) => def.date === 1 && def.mode === 1);
    expect(compound).toBeDefined();
  });
});

describe('Event model - pre-save hook (integration, in-memory MongoDB)', () => {
  beforeAll(async () => {
    await connectTestDB();
    await Event.init();
  }, 60000);

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  }, 30000);

  it('generates a slug from the title on creation', async () => {
    const event = await Event.create({ ...buildValidEventData(), title: 'Intro to TypeScript!' });
    expect(event.slug).toBe('intro-to-typescript');
  });

  it('collapses whitespace and strips special characters when generating the slug', async () => {
    const event = await Event.create({ ...buildValidEventData(), title: '  Hello,   World!! 2026  ' });
    expect(event.slug).toBe('hello-world-2026');
  });

  it('regenerates the slug when the title is modified on an existing document', async () => {
    const event = await Event.create(buildValidEventData());
    event.title = 'Advanced TypeScript Patterns';
    await event.save();
    expect(event.slug).toBe('advanced-typescript-patterns');
  });

  it('preserves a manually-set slug value when the title has not changed', async () => {
    const event = await Event.create(buildValidEventData());
    event.slug = 'custom-slug-value';
    event.venue = 'A Different Hall';
    await event.save();
    expect(event.slug).toBe('custom-slug-value');
  });

  it('normalizes a parsable, non-ISO date string to YYYY-MM-DD', async () => {
    const event = await Event.create({ ...buildValidEventData(), date: 'September 15, 2026' });
    expect(event.date).toBe('2026-09-15');
  });

  it('throws when the date is not parsable', async () => {
    await expect(
      Event.create({ ...buildValidEventData(), date: 'not-a-real-date' })
    ).rejects.toThrow('Invalid date format');
  });

  it('normalizes 12-hour PM time format to 24-hour HH:MM', async () => {
    const event = await Event.create({ ...buildValidEventData(), time: '2:30 PM' });
    expect(event.time).toBe('14:30');
  });

  it('normalizes 12:00 AM to 00:00 (midnight edge case)', async () => {
    const event = await Event.create({ ...buildValidEventData(), time: '12:00 AM' });
    expect(event.time).toBe('00:00');
  });

  it('keeps an already 24-hour time format intact', async () => {
    const event = await Event.create({ ...buildValidEventData(), time: '09:15' });
    expect(event.time).toBe('09:15');
  });

  it('throws when the time format is invalid', async () => {
    await expect(
      Event.create({ ...buildValidEventData(), time: 'not-a-time' })
    ).rejects.toThrow('Invalid time format');
  });

  it('enforces the unique slug index at the database level for duplicate titles', async () => {
    await Event.create({ ...buildValidEventData(), title: 'Duplicate Title Event' });
    await expect(
      Event.create({ ...buildValidEventData(), title: 'Duplicate Title Event' })
    ).rejects.toThrow();
  });
});