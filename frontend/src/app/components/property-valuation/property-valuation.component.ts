import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
      bedrooms: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      bathrooms: ['', [Validators.required, Validators.min(0), Validators.max(15)]],
      area: ['', [Validators.required, Validators.min(50)]],
      age: ['', [Validators.required, Validators.min(0)]]
    }, { validators: [this.physicalPlausibilityValidator()] });
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
      this.form.markAllAsTouched();
      this.error = this.getValidationMessage();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.result = null;

    const formValue = this.form.value;
    const valuationData = {
      city: formValue.city,
      country: formValue.country,
      propertyType: formValue.type,
      bedrooms: formValue.bedrooms,
      bathrooms: formValue.bathrooms,
      areaSqFt: formValue.area,
      propertyAge: formValue.age,
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

  hasFieldError(name: string, errorKey: string): boolean {
    const control = this.form.get(name);
    return Boolean(control && control.touched && control.hasError(errorKey));
  }

  getFieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('min')) {
      if (name === 'area') return 'Area must be at least 50 sq ft.';
      if (name === 'bedrooms') return 'Bedrooms cannot be less than 0.';
      if (name === 'bathrooms') return 'Bathrooms cannot be less than 0.';
      if (name === 'age') return 'Age cannot be less than 0.';
    }

    if (control.hasError('max')) {
      if (name === 'bedrooms') return 'Bedrooms cannot exceed 20.';
      if (name === 'bathrooms') return 'Bathrooms cannot exceed 15.';
    }

    return 'Please enter a valid value.';
  }

  private getValidationMessage(): string {
    const messages: string[] = [];

    if (this.form.get('area')?.hasError('min')) {
      messages.push('Area must be at least 50 sq ft.');
    }

    if (this.form.get('bedrooms')?.hasError('max')) {
      messages.push('Bedrooms cannot exceed 20.');
    }

    if (this.form.get('bathrooms')?.hasError('max')) {
      messages.push('Bathrooms cannot exceed 15.');
    }

    if (this.form.hasError('roomAreaMismatch')) {
      messages.push('Bedrooms and bathrooms look too high for the selected area. Please correct the listing details.');
    }

    if (messages.length > 0) {
      return messages.join(' ');
    }

    return 'Please fill in all required fields correctly';
  }

  private physicalPlausibilityValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const area = Number(control.get('area')?.value || 0);
      const bedrooms = Number(control.get('bedrooms')?.value || 0);
      const bathrooms = Number(control.get('bathrooms')?.value || 0);

      if (area < 50 || bedrooms > 20 || bathrooms > 15) {
        return null;
      }

      if (bedrooms + bathrooms > area / 50) {
        return { roomAreaMismatch: true };
      }

      return null;
    };
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
