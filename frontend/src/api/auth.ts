import api from "./axios";
import { User } from "../types";

export async function loginApi(email: string, password: string) {
  const { data } = await api.post<{ user: User; accessToken: string }>(
    "/auth/login",
    { email, password }
  );
  return data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string
) {
  const { data } = await api.post<{ user: User; accessToken: string }>(
    "/auth/register",
    { name, email, password }
  );
  return data;
}

export async function logoutApi() {
  await api.post("/auth/logout");
}

export async function refreshApi() {
  const { data } = await api.post<{ accessToken: string }>("/auth/refresh");
  return data.accessToken;
}

export async function meApi() {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}
