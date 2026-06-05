import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PropertyFilterSidebarComponent, PropertyListFilters } from '../property-filter-sidebar/property-filter-sidebar.component';
import { PropertyService, Property } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

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
  currentPage = 1;
  readonly pageSize = 9;
  filters: PropertyListFilters = {
    sortBy: 'newest'
  };
  currentUser: any = null;
  deleteTarget: Property | null = null;
  isDeleting = false;

  private readonly subscriptions = new Subscription();

  constructor(
    private propertyService: PropertyService,
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCityOptions();
    this.currentUser = this.authService.getCurrentUser();

    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    this.subscriptions.add(
      this.route.queryParamMap.subscribe(params => {
        this.currentPage = 1;
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
        this.syncCurrentPage();
        if (this.cityOptions.length === 0 && properties.length > 0) {
          this.cityOptions = this.extractCityOptions(properties);
        }
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
    this.propertyService.getPropertyCities().subscribe({
      next: (properties) => {
        this.cityOptions = properties;
        this.isCityLoading = false;
      },
      error: () => {
        this.cityOptions = [];
        this.isCityLoading = false;
      }
    });
  }

  onApplyFilters(filters: PropertyListFilters): void {
    this.currentPage = 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toQueryParams(filters),
      queryParamsHandling: '',
      replaceUrl: false
    });
  }

  onResetFilters(): void {
    this.currentPage = 1;
    this.router.navigate(['/properties']);
  }

  canManageProperty(property: Property): boolean {
    if (!property || !this.currentUser) {
      return false;
    }

    if (this.currentUser.role === 'admin') {
      return true;
    }

    const ownerId = this.getPropertyOwnerId(property);
    const currentUserId = this.currentUser._id || this.currentUser.id;
    return Boolean(ownerId && currentUserId && ownerId === currentUserId);
  }

  startDelete(property: Property): void {
    this.deleteTarget = property;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) {
      return;
    }

    const target = this.deleteTarget;
    this.isDeleting = true;

    this.propertyService.deleteProperty(target._id).subscribe({
      next: () => {
        this.properties = this.properties.filter(property => property._id !== target._id);
        this.syncCurrentPage();
        this.toastService.show('Property deleted.', 'error');
        this.isDeleting = false;
        this.deleteTarget = null;
      },
      error: error => {
        this.toastService.show(error.error?.message || 'Unable to delete the property.', 'error');
        this.isDeleting = false;
      }
    });
  }

  editProperty(property: Property): void {
    this.router.navigate(['/properties', property._id, 'edit']);
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

  isNewProperty(property: Property): boolean {
    if (!property.createdAt) {
      return false;
    }

    const createdAt = new Date(property.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return false;
    }

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - createdAt.getTime() <= sevenDaysInMs;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.properties.length / this.pageSize));
  }

  get paginatedProperties(): Property[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.properties.slice(startIndex, startIndex + this.pageSize);
  }

  get pageRangeLabel(): string {
    if (this.properties.length === 0) {
      return '0';
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.properties.length);
    return `${start}-${end}`;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  getPropertyOwnerId(property: Property): string {
    const createdBy = property.createdBy;
    if (typeof createdBy === 'string') {
      return createdBy;
    }

    return createdBy?._id || createdBy?.id || '';
  }

  private toNumberOrNull(value: string | null): number | null {
    if (value === null || value.trim() === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private syncCurrentPage(): void {
    const totalPages = this.totalPages;
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  private extractCityOptions(properties: Property[]): string[] {
    const cities = properties
      .map(property => property.city)
      .filter((city): city is string => Boolean(city));

    return Array.from(new Set(cities))
      .map(city => city.trim())
      .filter(city => city.length > 0)
      .sort((a, b) => a.localeCompare(b));
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
