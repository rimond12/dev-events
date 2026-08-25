import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Booking from './booking.model';
import Event from './event.model';
import { buildValidEventData } from '../tests/fixtures/event-data';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../tests/utils/memory-mongo';

describe('Booking model - schema validation (no DB required)', () => {
  it('fails validation when eventId is missing', () => {
    const booking = new Booking({ email: 'user@example.com' });
    const err = booking.validateSync();
    expect(err?.errors.eventId).toBeDefined();
  });

  it('fails validation when email is missing', () => {
    const booking = new Booking({ eventId: new mongoose.Types.ObjectId() });
    const err = booking.validateSync();
    expect(err?.errors.email).toBeDefined();
  });

  it.each([
    'not-an-email',
    'missing-at-sign.com',
    'foo@',
    '@bar.com',
    'foo bar@example.com',
  ])('rejects invalid email address "%s"', (email) => {
    const booking = new Booking({ eventId: new mongoose.Types.ObjectId(), email });
    const err = booking.validateSync();
    expect(err?.errors.email).toBeDefined();
  });

  it.each([
    'user@example.com',
    'first.last+tag@sub.example.co.uk',
    "o'brien@example.com",
  ])('accepts valid email address "%s"', (email) => {
    const booking = new Booking({ eventId: new mongoose.Types.ObjectId(), email });
    const err = booking.validateSync();
    expect(err).toBeUndefined();
  });

  it('lowercases and trims the email on assignment', () => {
    const booking = new Booking({
      eventId: new mongoose.Types.ObjectId(),
      email: '  MixedCase@Example.COM  ',
    });
    expect(booking.email).toBe('mixedcase@example.com');
  });

  it('rejects a malformed eventId value', () => {
    expect(() => {
      const booking = new Booking({ eventId: 'not-a-valid-object-id', email: 'user@example.com' });
      const err = booking.validateSync();
      if (err) throw err;
    }).toThrow();
  });
});

describe('Booking model - registered indexes', () => {
  it('defines a single-field index on eventId', () => {
    const indexes = Booking.schema.indexes();
    const single = indexes.some(
      ([def]) => def.eventId === 1 && Object.keys(def).length === 1
    );
    expect(single).toBe(true);
  });

  it('defines a compound index on eventId and createdAt', () => {
    const indexes = Booking.schema.indexes();
    const compound = indexes.some(([def]) => def.eventId === 1 && def.createdAt === -1);
    expect(compound).toBe(true);
  });

  it('defines a single-field index on email', () => {
    const indexes = Booking.schema.indexes();
    const single = indexes.some(
      ([def]) => def.email === 1 && Object.keys(def).length === 1
    );
    expect(single).toBe(true);
  });

  it('defines a named, unique compound index on eventId and email', () => {
    const indexes = Booking.schema.indexes();
    const uniqueIndex = indexes.find(([, options]) => options?.name === 'uniq_event_email');
    expect(uniqueIndex).toBeDefined();
    expect(uniqueIndex?.[0]).toMatchObject({ eventId: 1, email: 1 });
    expect(uniqueIndex?.[1]).toMatchObject({ unique: true });
  });
});

describe('Booking model - pre-save event existence hook (mocked Event.findById)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects with a generic ValidationError when the referenced event does not exist', async () => {
    const findByIdMock = vi.spyOn(Event, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    } as never);

    const eventId = new mongoose.Types.ObjectId();
    const booking = new Booking({ eventId, email: 'user@example.com' });

    await expect(booking.save()).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Invalid events ID format or database error',
    });
    expect(findByIdMock).toHaveBeenCalledWith(eventId);
  });

  it('rejects with the same generic ValidationError when the existence check itself throws', async () => {
    vi.spyOn(Event, 'findById').mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error('connection lost')),
    } as never);

    const booking = new Booking({ eventId: new mongoose.Types.ObjectId(), email: 'user@example.com' });

    await expect(booking.save()).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Invalid events ID format or database error',
    });
  });

});

describe('Booking model - integration with in-memory MongoDB', () => {
  beforeAll(async () => {
    await connectTestDB();
    await Booking.init();
    await Event.init();
  }, 60000);

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  }, 30000);

  it('creates a booking when the referenced event exists', async () => {
    const event = await Event.create(buildValidEventData());
    const booking = await Booking.create({ eventId: event._id, email: 'attendee@example.com' });
    expect(booking.email).toBe('attendee@example.com');
    expect(booking.eventId.toString()).toBe(event._id.toString());
  });

  it('rejects creating a booking for a non-existent event', async () => {
    const fakeEventId = new mongoose.Types.ObjectId();
    await expect(
      Booking.create({ eventId: fakeEventId, email: 'attendee@example.com' })
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('enforces one booking per event per email (unique compound index)', async () => {
    const event = await Event.create(buildValidEventData());
    await Booking.create({ eventId: event._id, email: 'duplicate@example.com' });
    await expect(
      Booking.create({ eventId: event._id, email: 'duplicate@example.com' })
    ).rejects.toThrow();
  });

  it('allows the same email to book two different events', async () => {
    const eventA = await Event.create({ ...buildValidEventData(), title: 'Event A' });
    const eventB = await Event.create({ ...buildValidEventData(), title: 'Event B' });
    await Booking.create({ eventId: eventA._id, email: 'shared@example.com' });
    const secondBooking = await Booking.create({ eventId: eventB._id, email: 'shared@example.com' });
    expect(secondBooking).toBeDefined();
  });

  it('does not re-validate eventId when saving an unrelated field change on an existing booking', async () => {
    const event = await Event.create(buildValidEventData());
    const booking = await Booking.create({ eventId: event._id, email: 'user2@example.com' });

    // Delete the referenced event to prove the hook is skipped when eventId is unmodified.
    await Event.deleteOne({ _id: event._id });

    booking.email = 'updated@example.com';
    await expect(booking.save()).resolves.toBeDefined();
    expect(booking.email).toBe('updated@example.com');
  });
});