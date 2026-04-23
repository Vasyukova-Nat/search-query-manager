import axios from "axios";
import { PaginatedResponse, SearchQuery, QueryFormData } from "../types";

const api = axios.create({ baseURL: "http://localhost:8000/api" });

export const fetchQueries = async (
  page: number,
  pageSize: number,
  sortBy?: string,
  sortOrder?: string
): Promise<PaginatedResponse> => {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (sortBy) {
    params.sort_by = sortBy;
    params.sort_order = sortOrder || "ascend";
  }
  const { data } = await api.get("/queries", { params });
  return data;
};

export const createQuery = (data: QueryFormData): Promise<SearchQuery> =>
  api.post("/queries", data).then((r) => r.data);

export const updateQuery = (id: number, data: QueryFormData): Promise<SearchQuery> =>
  api.put(`/queries/${id}`, data).then((r) => r.data);

export const deleteQuery = (id: number): Promise<void> =>
  api.delete(`/queries/${id}`);

export const batchDelete = (ids: number[]): Promise<void> =>
  api.post("/queries/batch-delete", ids);