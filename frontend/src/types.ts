export interface SearchQuery {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  owner: string;
  deadline: string;
  found_objects_count: number;
  is_expired: boolean;
}

export interface PaginatedResponse {
  items: SearchQuery[];
  total: number;
  page: number;
  page_size: number;
}

export interface QueryFormData {
  name: string;
  is_active: boolean;
  deadline: string;
}