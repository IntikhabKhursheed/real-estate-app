import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Property {
  _id: string;
  title: string;
  city: string;
  country: string;
  type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities?: string[];
  age?: number;
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

  getProperties(): Observable<Property[]> {
    return this.http.get<ApiResponse<Property[]>>(this.apiUrl).pipe(
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
}
