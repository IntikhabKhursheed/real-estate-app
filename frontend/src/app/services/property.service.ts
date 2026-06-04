import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PropertyListFilters } from '../components/property-filter-sidebar/property-filter-sidebar.component';

export interface Property {
  _id: string;
  title: string;
  description: string;
  city: string;
  areaName?: string;
  address?: string;
  country: string;
  type: string;
  propertyType?: string;
  purpose?: 'Sale' | 'Rent' | string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaSqFt?: number;
  areaMarla?: number;
  features?: string[];
  amenities?: string[];
  age?: number;
  propertyAge?: number;
  images?: string[];
  status?: 'Active' | 'Inactive';
  views?: number;
  createdBy?: Agent | string;
  agent?: Agent;
  createdAt?: string;
}

export interface Agent {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface DashboardInquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
  property: {
    _id: string;
    title: string;
    city: string;
    price: number;
    propertyType: string;
    status: string;
  };
  agent: Agent;
}

export interface DashboardPropertySummary extends Property {
  status?: 'Active' | 'Inactive';
  views?: number;
}

export interface AgentDashboardResponse {
  summary: {
    totalListings: number;
    activeListings: number;
    totalViews: number;
  };
  properties: DashboardPropertySummary[];
  recentInquiries: DashboardInquiry[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = 'http://localhost:5000/api/properties';
  private dashboardApiUrl = 'http://localhost:5000/api/dashboard';

  constructor(private http: HttpClient) { }

  getProperties(filters?: PropertyListFilters): Observable<Property[]> {
    return this.http.get<ApiResponse<Property[]>>(this.apiUrl, {
      params: this.buildQueryParams(filters)
    }).pipe(
      map(response => response.data || [])
    );
  }

  getPropertyById(id: string): Observable<Property> {
    return this.http.get<ApiResponse<Property>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  searchProperties(query: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/search`, { query }).pipe(
      map(response => ({
        results: response.data?.results || [],
        reasoning: response.data?.reasoning || ''
      }))
    );
  }

  createProperty(data: any): Observable<Property> {
    return this.http.post<ApiResponse<Property>>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  updateProperty(id: string, data: any): Observable<Property> {
    return this.http.put<ApiResponse<Property>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  updatePropertyStatus(id: string, status: 'Active' | 'Inactive'): Observable<Property> {
    return this.http.patch<ApiResponse<Property>>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      map(response => response.data)
    );
  }

  deleteProperty(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }

  uploadPropertyImages(propertyId: string, files: File[]): Observable<Property> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    return this.http.post<ApiResponse<Property>>(`${this.apiUrl}/${propertyId}/images`, formData).pipe(
      map(response => response.data)
    );
  }

  getAgentDashboard(): Observable<AgentDashboardResponse> {
    return this.http.get<ApiResponse<AgentDashboardResponse>>(`${this.dashboardApiUrl}/agent`).pipe(
      map(response => response.data)
    );
  }

  private buildQueryParams(filters?: PropertyListFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) {
      return params;
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      params = params.set(key, String(value));
    });

    return params;
  }
}
