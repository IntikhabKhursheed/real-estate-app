import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvestmentResponse {
  investmentScore: number;
  confidence: number;
  reasoning: string;
  recommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private apiUrl = 'http://localhost:5000/api/properties/investment';

  constructor(private http: HttpClient) { }

  calculateInvestment(propertyId: string): Observable<InvestmentResponse> {
    return this.http.post<InvestmentResponse>(this.apiUrl, { propertyId });
  }
}
