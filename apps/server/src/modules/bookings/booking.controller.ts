import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { createBookingSchema, updateBookingSchema } from './booking.validation.js';
import * as bookingService from './booking.service.js';
import { toBookingDto } from './booking.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${name}`);
  }
  return value;
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createBookingSchema.parse(req.body);
  const booking = await bookingService.createBooking(user, input);
  res.status(201).json({ booking: await toBookingDto(booking) });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const bookings = await bookingService.listMyBookings(user);
  res.json({ bookings: await Promise.all(bookings.map(toBookingDto)) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = updateBookingSchema.parse(req.body);
  const booking = await bookingService.updateBooking(requireParam(req, 'id'), user, input);
  res.json({ booking: await toBookingDto(booking) });
}
