export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
  }
}

export interface FileUpload {
  id: string
  name: string
  url: string
  size: number
  type: string
  createdAt: string
}

export interface Address {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export interface ContactInfo {
  phone: string
  email: string
}
