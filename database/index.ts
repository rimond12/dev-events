/**
 * database/index.ts
 *
 * Central barrel export for all Mongoose models.
 * Import from here instead of individual model files to keep
 * imports clean and consistent across the application.
 *
 * Usage:
 *   import { Event, Booking } from '@/database';
 */

export { default as Event } from './event.model';
export type { IEvent } from './event.model';

export { default as Booking } from './booking.model';
export type { IBooking } from './booking.model';
