import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValuationService, ValuationResponse } from '../../services/valuation.service';

@Component({
  selector: 'app-property-valuation',
  standalone: false,
  templateUrl: './property-valuation.component.html',
  styleUrls: ['./property-valuation.component.css']
})
export class PropertyValuationComponent implements OnInit {
  form!: FormGroup;
  isLoading: boolean = false;
  error: string | null = null;
  result: ValuationResponse | null = null;
  amenitiesList: string[] = ['Pool', 'Garage', 'Garden', 'Balcony', 'Gym', 'Security System', 'Air Conditioning'];
  selectedAmenities: string[] = [];

  constructor(
    private fb: FormBuilder,
    private valuationService: ValuationService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      city: ['', [Validators.required]],
      country: ['', [Validators.required]],
      type: ['', [Validators.required]],
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      area: ['', [Validators.required, Validators.min(100)]],
      age: ['', [Validators.required, Validators.min(0)]]
    });
  }

  toggleAmenity(amenity: string): void {
    const index = this.selectedAmenities.indexOf(amenity);
    if (index > -1) {
      this.selectedAmenities.splice(index, 1);
    } else {
      this.selectedAmenities.push(amenity);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.error = 'Please fill in all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.result = null;

    const valuationData = {
      ...this.form.value,
      amenities: this.selectedAmenities
    };

    this.valuationService.estimateProperty(valuationData).subscribe({
      next: (response) => {
        this.result = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Valuation error:', err);
        this.error = err.error?.message || 'Failed to get valuation. Please try again.';
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.form.reset();
    this.selectedAmenities = [];
    this.result = null;
    this.error = null;
  }

  getRatingColor(rating: string): string {
    switch (rating.toLowerCase()) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400';
      case 'good':
        return 'text-blue-600 dark:text-blue-400';
      case 'fair':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'poor':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  getRatingBgColor(rating: string): string {
    switch (rating.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 dark:bg-green-900';
      case 'good':
        return 'bg-blue-100 dark:bg-blue-900';
      case 'fair':
        return 'bg-yellow-100 dark:bg-yellow-900';
      case 'poor':
        return 'bg-red-100 dark:bg-red-900';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  }
}
