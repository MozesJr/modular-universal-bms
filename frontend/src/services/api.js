import axios from "axios";

const api = axios.create({
  baseURL: (process.env.VUE_APP_API_URL || "") + "/api",
  timeout: 8000,
});

export default api;
