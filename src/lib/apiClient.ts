"use client";

import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseURL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (typeof window === "undefined"
    ? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` // On Vercel server
      : "http://localhost:3000" // Local dev server
    : window.location.origin); // On browser

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Get tokens
function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

function saveTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

// Check if access token expired (optional optimization)
function isTokenExpired(token: string) {
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Add token automatically
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors with refresh
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       const refreshToken = getRefreshToken();
//       if (!refreshToken) {
//         clearTokens();
//         window.location.href = "/login";
//         return Promise.reject(error);
//       }

//       try {
//         const res = await axios.post(
//           `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/refresh/`,
//           { refreshToken }
//         );

//         const { accessToken: newAccessToken } = res.data;

//         if (newAccessToken) {
//           saveTokens(newAccessToken);
//           originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//           return api(originalRequest);
//         }
//       } catch (err) {
//         clearTokens();
//         window.location.href = "/login";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // If accessToken expired and refresh failed, force login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export {
  saveTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
};
