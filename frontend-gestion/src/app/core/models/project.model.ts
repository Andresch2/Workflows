export interface Project {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasNextPage: boolean;
  total?: number;
}