import { getSession } from 'next-auth/react';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api`;

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    const accessToken = (session as any)?.accessToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Users API
  users = {
    getAll: () => this.request<any[]>('/users'),
    getById: (id: string) => this.request<any>(`/users/${id}`),
    getByAuth0Id: (auth0Id: string) => this.request<any>(`/users/auth0/${auth0Id}`),
    create: (data: any) => this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
  };

  // Services API
  services = {
    getAll: () => this.request<any[]>('/services'),
    getById: (id: string) => this.request<any>(`/services/${id}`),
    getByProvider: (providerId: string) => this.request<any[]>(`/services/provider/${providerId}`),
    create: (data: any) => this.request<any>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/services/${id}`, {
      method: 'DELETE',
    }),
  };

  // Categories API
  categories = {
    getAll: () => this.request<any[]>('/categories'),
    getById: (id: string) => this.request<any>(`/categories/${id}`),
    create: (data: any) => this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    }),
  };

  // Service Providers API
  serviceProviders = {
    getAll: () => this.request<any[]>('/service-providers'),
    getById: (id: string) => this.request<any>(`/service-providers/${id}`),
    getByLocation: (locationId: string) => this.request<any[]>(`/service-providers/location/${locationId}`),
    create: (data: any) => this.request<any>('/service-providers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/service-providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/service-providers/${id}`, {
      method: 'DELETE',
    }),
  };

  // Cities API
  cities = {
    getAll: () => this.request<any[]>('/cities'),
    getById: (id: string) => this.request<any>(`/cities/${id}`),
  };

  // FAQs API
  faqs = {
    getAll: () => this.request<any[]>('/faqs'),
    getById: (id: string) => this.request<any>(`/faqs/${id}`),
    create: (data: any) => this.request<any>('/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/faqs/${id}`, {
      method: 'DELETE',
    }),
  };
}

export const apiClient = new ApiClient();
