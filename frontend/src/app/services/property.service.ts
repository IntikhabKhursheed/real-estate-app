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

  uploadPropertyImages(propertyId: string, files: File[]): Observable<Property> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    return this.http.post<ApiResponse<Property>>(`${this.apiUrl}/${propertyId}/images`, formData).pipe(
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
