import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MarketAreaInsight {
  area: string;
  averagePricePerMarla: number;
  listingCount: number;
  trend: 'Rising' | 'Stable' | 'Falling';
}

export interface MarketInvestmentArea {
  area: string;
  reason: string;
}

export interface MarketTrendResponse {
  city: string;
  priceTrend: 'Rising' | 'Stable' | 'Falling';
  averagePricePerMarlaByArea: MarketAreaInsight[];
  bestAreasToInvest: MarketInvestmentArea[];
  marketSummary: string;
  investmentRecommendation: string;
  sampleSize?: number;
  hasLocalData?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class MarketIntelligenceService {
  private apiUrl = 'http://localhost:5000/api/market';

  constructor(private http: HttpClient) { }

  getMarketTrends(city: string): Observable<MarketTrendResponse> {
    return this.http.get<ApiResponse<MarketTrendResponse>>(`${this.apiUrl}/trends`, {
      params: { city }
    }).pipe(
      map(response => response.data)
    );
  }
}
