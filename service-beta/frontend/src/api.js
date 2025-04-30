import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000"
});

export const segmentSlice = (file, sliceIdx) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/segment/?slice_idx=${sliceIdx}`, fd);
};
