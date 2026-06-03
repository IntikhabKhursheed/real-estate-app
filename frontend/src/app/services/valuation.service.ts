import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ValuationRequest {
  city: string;
  country: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  propertyAge?: number;
  amenities?: string[];
}

export interface ValuationResponse {
  estimatedPrice: number;
  confidence: number;
  investmentRating: string;
  reasoning: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ValuationService {
  private apiUrl = 'http://localhost:5000/api/valuation/estimate';

  constructor(private http: HttpClient) { }

  estimateProperty(data: ValuationRequest): Observable<ValuationResponse> {
    return this.http.post<ApiResponse<ValuationResponse>>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }
}
