import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface InvestmentResponse {
  investmentScore: number;
  score?: number;
  confidence: number | string;
  reasoning: string[] | string;
  recommendation?: string;
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
  private valuationApiUrl = 'http://localhost:5000/api/valuation';

  constructor(private http: HttpClient) { }

  calculateInvestment(propertyId: string): Observable<InvestmentResponse> {
    return this.http.post<ApiResponse<InvestmentResponse>>(this.apiUrl, { propertyId }).pipe(
      map(response => response.data)
    );
  }

  getInvestmentScore(propertyId: string): Observable<InvestmentResponse> {
    return this.http.get<ApiResponse<InvestmentResponse>>(`${this.valuationApiUrl}/investment-score/${propertyId}`).pipe(
      map(response => response.data)
    );
  }
}
