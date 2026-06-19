import api from "./axios";

export const createReview = async ({ booking_id, rating, comment }) => {
  const response = await api.post("/reviews/create/", {
    booking_id,
    rating,
    comment: comment || "",
  });
  return response.data;
  // Response: { id, booking, customer_name, worker_name, rating, comment, created_at }
};

export const getWorkerReviews = async (workerId) => {
  const response = await api.get(`/reviews/worker/${workerId}/`);
  return response.data;
};

export const getPendingReviews = async () => {
  const response = await api.get("/reviews/pending/");
  return response.data;
};