import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PropertyFilterSidebarComponent, PropertyListFilters } from '../property-filter-sidebar/property-filter-sidebar.component';
import { PropertyService, Property } from '../../services/property.service';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PropertyFilterSidebarComponent],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css']
})
export class PropertyListComponent implements OnInit, OnDestroy {
  properties: Property[] = [];
  cityOptions: string[] = [];
  isLoading = false;
  isCityLoading = false;
  error: string | null = null;
  filters: PropertyListFilters = {
    sortBy: 'newest'
  };

  private readonly subscriptions = new Subscription();

  constructor(
    private propertyService: PropertyService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCityOptions();

    this.subscriptions.add(
      this.route.queryParamMap.subscribe(params => {
        this.filters = {
          city: params.get('city') || undefined,
          propertyType: params.get('propertyType') || undefined,
          purpose: params.get('purpose') || undefined,
          bedrooms: params.get('bedrooms') || undefined,
          minPrice: this.toNumberOrNull(params.get('minPrice')),
          maxPrice: this.toNumberOrNull(params.get('maxPrice')),
          minAreaMarla: this.toNumberOrNull(params.get('minAreaMarla')),
          maxAreaMarla: this.toNumberOrNull(params.get('maxAreaMarla')),
          sortBy: params.get('sortBy') || 'newest'
        };

        this.loadProperties();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.error = null;

    this.propertyService.getProperties(this.filters).subscribe({
      next: (properties) => {
        this.properties = properties;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.error = 'Failed to load properties. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  loadCityOptions(): void {
    this.isCityLoading = true;
    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        const cities = properties
          .map(property => property.city)
          .filter((city): city is string => Boolean(city));
        this.cityOptions = Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b));
        this.isCityLoading = false;
      },
      error: () => {
        this.cityOptions = [];
        this.isCityLoading = false;
      }
    });
  }

  onApplyFilters(filters: PropertyListFilters): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toQueryParams(filters),
      queryParamsHandling: '',
      replaceUrl: false
    });
  }

  onResetFilters(): void {
    this.router.navigate(['/properties']);
  }

  get activeSortLabel(): string {
    switch (this.filters.sortBy) {
      case 'price-low-high':
        return 'Price: Low to High';
      case 'price-high-low':
        return 'Price: High to Low';
      case 'investment-score':
        return 'Investment Score';
      default:
        return 'Newest';
    }
  }

  trackByPropertyId(_: number, property: Property): string {
    return property._id;
  }

  private toNumberOrNull(value: string | null): number | null {
    if (value === null || value.trim() === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private toQueryParams(filters: PropertyListFilters): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters.city) params['city'] = filters.city;
    if (filters.propertyType) params['propertyType'] = filters.propertyType;
    if (filters.purpose) params['purpose'] = filters.purpose;
    if (filters.bedrooms) params['bedrooms'] = filters.bedrooms;
    if (filters.minPrice !== null && filters.minPrice !== undefined) params['minPrice'] = String(filters.minPrice);
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) params['maxPrice'] = String(filters.maxPrice);
    if (filters.minAreaMarla !== null && filters.minAreaMarla !== undefined) params['minAreaMarla'] = String(filters.minAreaMarla);
    if (filters.maxAreaMarla !== null && filters.maxAreaMarla !== undefined) params['maxAreaMarla'] = String(filters.maxAreaMarla);
    if (filters.sortBy) params['sortBy'] = filters.sortBy;

    return params;
  }
}
