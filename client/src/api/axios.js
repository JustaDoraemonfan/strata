import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

let _getStore = null;
export const injectStore = (getter) => {
  _getStore = getter;
};

api.interceptors.request.use((config) => {
  const token = _getStore?.().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          {
            withCredentials: true,
          },
        );
        _getStore?.().setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        _getStore?.().clearAuth();
        // window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
