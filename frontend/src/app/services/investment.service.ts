import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface InvestmentResponse {
  investmentScore: number;
  confidence: number;
  reasoning: string;
  recommendation: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private apiUrl = 'http://localhost:5000/api/properties/investment';

  constructor(private http: HttpClient) { }

  calculateInvestment(propertyId: string): Observable<InvestmentResponse> {
    return this.http.post<ApiResponse<InvestmentResponse>>(this.apiUrl, { propertyId }).pipe(
      map(response => response.data)
    );
  }
}
