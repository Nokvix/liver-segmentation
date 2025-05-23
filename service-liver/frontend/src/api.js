import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000"
// });

const api = axios.create({
    baseURL: "/"
})

export const uploadFile = (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/upload", fd);
};

export const segmentSlice = (fileId, sliceIdx) => {
    return api.get('/segment', {
        params: {file_id: fileId, slice_idx: sliceIdx}
    });
};
