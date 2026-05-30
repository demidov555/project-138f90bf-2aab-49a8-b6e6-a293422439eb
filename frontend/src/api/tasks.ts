import api from "./axios";
import { Task } from "../types";

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listTasks() {
  const { data } = await api.get<PagedResponse<Task>>("/tasks");
  return data;
}

export async function createTask(task: {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assignee_id?: string | null;
}) {
  const { data } = await api.post<Task>("/tasks", task);
  return data;
}
