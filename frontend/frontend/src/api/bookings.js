// src/api/bookings.js
import api from "./axios";

export const getMyBookings = async () => {
  const response = await api.get("/bookings/my-bookings/");
  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.bookings)) return data.bookings;
  return [];
};

export const getWorkerBookings = async () => {
  const response = await api.get("/bookings/worker-bookings/");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};


export const getBookingStats = async () => {
  const response = await api.get("/bookings/stats/");
  return response.data; // this one returns an object, not array — fine as-is
};

export const createBooking = async (data) => {
  const response = await api.post("/bookings/create/", data);
  return response.data;
};

export const updateBookingStatus = async ({ id, status }) => {
  const response = await api.patch(`/bookings/${id}/update-status/`, { status });
  return response.data;
};