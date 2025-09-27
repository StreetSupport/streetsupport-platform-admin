import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import type { IUser, IService, ICategory, IServiceProvider, ICity, IFaq } from '@/types';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session: Session | null = await getSession();
    const accessToken = session?.accessToken;

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
    getAll: () => this.request<IUser[]>('/users'),
    getById: (id: string) => this.request<IUser>(`/users/${id}`),
    getByAuth0Id: (auth0Id: string) => this.request<IUser>(`/users/auth0/${auth0Id}`),
    create: (data: Partial<IUser>) => this.request<IUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<IUser>) => this.request<IUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
  };

  // Services API
  services = {
    getAll: () => this.request<IService[]>('/services'),
    getById: (id: string) => this.request<IService>(`/services/${id}`),
    getByProvider: (providerId: string) => this.request<IService[]>(`/services/provider/${providerId}`),
    create: (data: Partial<IService>) => this.request<IService>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<IService>) => this.request<IService>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/services/${id}`, {
      method: 'DELETE',
    }),
  };

  // Categories API
  categories = {
    getAll: () => this.request<ICategory[]>('/categories'),
    getById: (id: string) => this.request<ICategory>(`/categories/${id}`),
    create: (data: Partial<ICategory>) => this.request<ICategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<ICategory>) => this.request<ICategory>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    }),
  };

  // Service Providers API
  serviceProviders = {
    getAll: () => this.request<IServiceProvider[]>('/service-providers'),
    getById: (id: string) => this.request<IServiceProvider>(`/service-providers/${id}`),
    getByLocation: (locationId: string) => this.request<IServiceProvider[]>(`/service-providers/location/${locationId}`),
    create: (data: Partial<IServiceProvider>) => this.request<IServiceProvider>('/service-providers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<IServiceProvider>) => this.request<IServiceProvider>(`/service-providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/service-providers/${id}`, {
      method: 'DELETE',
    }),
  };

  // Cities API
  cities = {
    getAll: () => this.request<ICity[]>('/cities'),
    getById: (id: string) => this.request<ICity>(`/cities/${id}`),
  };

  // FAQs API
  faqs = {
    getAll: () => this.request<IFaq[]>('/faqs'),
    getById: (id: string) => this.request<IFaq>(`/faqs/${id}`),
    create: (data: Partial<IFaq>) => this.request<IFaq>('/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<IFaq>) => this.request<IFaq>(`/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/faqs/${id}`, {
      method: 'DELETE',
    }),
  };
}

export const apiClient = new ApiClient();
