import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { MarketIntelligenceService, MarketTrendResponse } from '../../services/market-intelligence.service';

@Component({
  selector: 'app-market-intelligence',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './market-intelligence.component.html',
  styleUrls: ['./market-intelligence.component.css']
})
export class MarketIntelligenceComponent implements OnInit {
  cityOptions: string[] = ['Lahore', 'Karachi', 'Islamabad', 'Peshawar', 'Rawalpindi'];
  isLoadingCities = false;
  isLoading = false;
  error: string | null = null;
  report: MarketTrendResponse | null = null;
  selectedCity = '';
  private readonly storageKey = 'estateiq-market-city';

  form = this.fb.group({
    city: ['']
  });

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private marketService: MarketIntelligenceService
  ) { }

  ngOnInit(): void {
    this.loadCityOptions();

    const savedCity = localStorage.getItem(this.storageKey);
    if (savedCity && this.cityOptions.includes(savedCity)) {
      this.form.patchValue({ city: savedCity }, { emitEvent: false });
      this.selectedCity = savedCity;
      this.loadMarketTrends();
    }
  }

  loadCityOptions(): void {
    this.isLoadingCities = true;
    this.propertyService.getProperties().subscribe({
      next: properties => {
        const cities = properties
          .map(property => property.city)
          .filter((city): city is string => Boolean(city));
        const merged = new Set([...this.cityOptions, ...cities]);
        this.cityOptions = Array.from(merged).sort((a, b) => a.localeCompare(b));
        const currentCity = (this.form.get('city')?.value || '').trim();
        if (currentCity) {
          this.form.patchValue({ city: currentCity }, { emitEvent: false });
          this.selectedCity = currentCity;
        }
        this.isLoadingCities = false;
      },
      error: () => {
        this.isLoadingCities = false;
      }
    });
  }

  loadMarketTrends(): void {
    const city = (this.form.get('city')?.value || '').trim();
    if (!city) {
      this.error = 'Please select a city first.';
      return;
    }

    this.selectedCity = city;
    this.isLoading = true;
    this.error = null;

    this.marketService.getMarketTrends(city).subscribe({
      next: report => {
        this.report = report;
        localStorage.setItem(this.storageKey, city);
        this.isLoading = false;
      },
      error: error => {
        console.error('Market intelligence load error:', error);
        this.error = error.error?.message || 'We could not load market intelligence right now.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    this.loadMarketTrends();
  }

  get trendBadgeClass(): string {
    switch (this.report?.priceTrend) {
      case 'Rising':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-200 dark:text-emerald-950';
      case 'Falling':
        return 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-950';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-950';
    }
  }

  get trendAccentClass(): string {
    switch (this.report?.priceTrend) {
      case 'Rising':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'Falling':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  }

  getTrendBadgeClass(trend: 'Rising' | 'Stable' | 'Falling' | string): string {
    switch (trend) {
      case 'Rising':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-200 dark:text-emerald-950';
      case 'Falling':
        return 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-950';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-950';
    }
  }

  formatCurrency(value: number | undefined): string {
    return `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
  }

  trackByArea(_: number, area: { area: string }): string {
    return area.area;
  }
}
