/**
 * Unit tests for the database/index.ts barrel export.
 *
 * These tests only check that the barrel re-exports point at the same
 * model objects as the underlying files; they do not need a database
 * connection since Mongoose model compilation happens at import time.
 */

import * as DatabaseBarrel from './index';
import EventModel from './event.model';
import BookingModel from './booking.model';

describe('database barrel exports', () => {
  it('re-exports the Event model as the default export from event.model', () => {
    expect(DatabaseBarrel.Event).toBe(EventModel);
  });

  it('re-exports the Booking model as the default export from booking.model', () => {
    expect(DatabaseBarrel.Booking).toBe(BookingModel);
  });

  it('exposes exactly the Event and Booking value exports', () => {
    const exportedKeys = Object.keys(DatabaseBarrel).sort();
    expect(exportedKeys).toEqual(['Booking', 'Event']);
  });
});