export interface LoginRequest {
  restaurant_id: string; // FIXED: Changed from email to restaurant_id
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  role: string;
  restaurant_id: string;
}

export interface User {
  access_token: string;
  refresh_token: string;
  role: string;
  restaurant_id: string;
  email?: string;
}

export interface ChatLog {
  client_id: string;
  table_id: string;
  message: string;
  answer: string;
  timestamp: string;
  ai_enabled: boolean; // ✅ Added AI toggle status
}

export interface ChatLogsResponse {
  logs: ChatLog[];
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  role: string;
}