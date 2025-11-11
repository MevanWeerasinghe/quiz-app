// Utility to get the API base URL
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
// Remove trailing slash if present
export const API_URL = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
