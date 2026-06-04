import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

export interface PropertyListFilters {
  city?: string;
  propertyType?: string;
  purpose?: string;
  bedrooms?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  minAreaMarla?: number | null;
  maxAreaMarla?: number | null;
  sortBy?: string;
}

@Component({
  selector: 'app-property-filter-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './property-filter-sidebar.component.html',
  styleUrls: ['./property-filter-sidebar.component.css']
})
export class PropertyFilterSidebarComponent implements OnChanges {
  @Input() cityOptions: string[] = [];
  @Input() filters: PropertyListFilters = {};
  @Output() applyFilters = new EventEmitter<PropertyListFilters>();
  @Output() resetFilters = new EventEmitter<void>();

  propertyTypes = ['Apartment', 'House', 'Plot', 'Commercial'];
  purposes = ['Sale', 'Rent'];
  bedroomOptions = [
    { label: 'Any', value: '' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5+', value: '5+' }
  ];
  sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price Low-High', value: 'price-low-high' },
    { label: 'Price High-Low', value: 'price-high-low' },
    { label: 'Investment Score', value: 'investment-score' }
  ];

  form = this.fb.group({
    city: [''],
    propertyType: [''],
    purpose: [''],
    bedrooms: [''],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    minAreaMarla: [null as number | null],
    maxAreaMarla: [null as number | null],
    sortBy: ['newest']
  });

  constructor(private fb: FormBuilder) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters'] && this.filters) {
      this.form.patchValue({
        city: this.filters.city || '',
        propertyType: this.filters.propertyType || '',
        purpose: this.filters.purpose || '',
        bedrooms: this.filters.bedrooms || '',
        minPrice: this.filters.minPrice ?? null,
        maxPrice: this.filters.maxPrice ?? null,
        minAreaMarla: this.filters.minAreaMarla ?? null,
        maxAreaMarla: this.filters.maxAreaMarla ?? null,
        sortBy: this.filters.sortBy || 'newest'
      }, { emitEvent: false });
    }
  }

  onApply(): void {
    const value = this.form.getRawValue();
    this.applyFilters.emit({
      city: value.city?.trim() || undefined,
      propertyType: value.propertyType || undefined,
      purpose: value.purpose || undefined,
      bedrooms: value.bedrooms || undefined,
      minPrice: value.minPrice ?? null,
      maxPrice: value.maxPrice ?? null,
      minAreaMarla: value.minAreaMarla ?? null,
      maxAreaMarla: value.maxAreaMarla ?? null,
      sortBy: value.sortBy || 'newest'
    });
  }

  onReset(): void {
    this.form.reset({
      city: '',
      propertyType: '',
      purpose: '',
      bedrooms: '',
      minPrice: null,
      maxPrice: null,
      minAreaMarla: null,
      maxAreaMarla: null,
      sortBy: 'newest'
    });
    this.resetFilters.emit();
  }

  get cityList(): string[] {
    return this.cityOptions.length > 0 ? this.cityOptions : ['Lahore', 'Karachi', 'Islamabad', 'Peshawar', 'Rawalpindi'];
  }

  get minPriceLabel(): string {
    return new Intl.NumberFormat('en-PK').format(this.form.get('minPrice')?.value || 0);
  }

  get maxPriceLabel(): string {
    return new Intl.NumberFormat('en-PK').format(this.form.get('maxPrice')?.value || 500000000);
  }
}
