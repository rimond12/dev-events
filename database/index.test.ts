import { describe, it, expect } from 'vitest';
import { Event, Booking } from './index';
import EventDefault from './event.model';
import BookingDefault from './booking.model';

describe('database barrel exports (database/index.ts)', () => {
  it('re-exports Event as the same model reference as the default export from event.model', () => {
    expect(Event).toBe(EventDefault);
    expect(Event.modelName).toBe('Event');
  });

  it('re-exports Booking as the same model reference as the default export from booking.model', () => {
    expect(Booking).toBe(BookingDefault);
    expect(Booking.modelName).toBe('Booking');
  });

  it('exposes both Event and Booking as constructible Mongoose models', () => {
    expect(typeof Event).toBe('function');
    expect(typeof Booking).toBe('function');
  });
});