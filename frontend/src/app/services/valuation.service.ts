import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ValuationRequest {
  city: string;
  country: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  age: number;
  amenities: string[];
}

export interface ValuationResponse {
  estimatedPrice: number;
  confidence: number;
  investmentRating: string;
  reasoning: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValuationService {
  private apiUrl = 'http://localhost:5000/api/valuation/estimate';

  constructor(private http: HttpClient) { }

  estimateProperty(data: ValuationRequest): Observable<ValuationResponse> {
    return this.http.post<ValuationResponse>(this.apiUrl, data);
  }
}
