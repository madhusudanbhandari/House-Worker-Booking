import api from "./axios";

export const getMyBookings = async () => {
  const response = await api.get("/bookings/my-bookings/");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

export const getWorkerBookings = async () => {
  const response = await api.get("/bookings/worker-bookings/");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}/`);
  return response.data;
};

export const getBookingStats = async () => {
  const response = await api.get("/bookings/stats/");
  return response.data;
};

export const updateBookingStatus = async ({ id, status, note = "" }) => {
  const response = await api.patch(`/bookings/${id}/update-status/`, {
    status,
    note,
  });
  return response.data;
};

export const createBooking = async (data) => {
  const response = await api.post("/bookings/create/", data);
  return response.data;
};