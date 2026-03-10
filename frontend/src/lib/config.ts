const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const rawFrontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
export const FRONTEND_URL = rawFrontendUrl.replace(/\/+$/, "");
