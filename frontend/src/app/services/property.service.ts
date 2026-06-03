import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  amenities: string[];
  age?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = 'http://localhost:5000/api/properties';

  constructor(private http: HttpClient) { }

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl);
  }

  getPropertyById(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }

  searchProperties(query: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/search`, { query });
  }

  createProperty(data: any): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, data);
  }
}
