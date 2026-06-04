import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { PropertyService } from '../../services/property.service';

interface ImagePreview {
  name: string;
  size: number;
  url: string;
}

@Component({
  selector: 'app-property-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './property-create.component.html',
  styleUrls: ['./property-create.component.scss']
})
export class PropertyCreateComponent implements OnDestroy {
  propertyTypes = ['Apartment', 'House', 'Plot', 'Commercial'];
  purposes = ['Sale', 'Rent'];
  selectedFiles: File[] = [];
  imagePreviews: ImagePreview[] = [];
  isSubmitting = false;
  error: string | null = null;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    price: [null as number | null, [Validators.required, Validators.min(1)]],
    city: ['', [Validators.required]],
    areaName: [''],
    address: [''],
    country: ['Pakistan', [Validators.required]],
    bedrooms: [0, [Validators.required, Validators.min(0)]],
    bathrooms: [0, [Validators.required, Validators.min(0)]],
    areaSqFt: [null as number | null, [Validators.required, Validators.min(1)]],
    areaMarla: [null as number | null, [Validators.min(0)]],
    propertyType: ['', [Validators.required]],
    purpose: ['Sale', [Validators.required]],
    propertyAge: [0, [Validators.min(0)]],
    features: ['']
  });

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router
  ) { }

  ngOnDestroy(): void {
    this.revokePreviewUrls();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.error = null;

    if (files.length === 0) {
      return;
    }

    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      this.error = 'Only image files can be uploaded.';
    }

    const remainingSlots = Math.max(0, 8 - this.selectedFiles.length);
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      this.error = 'You can upload up to 8 images per property.';
    }

    filesToAdd.forEach(file => {
      this.selectedFiles.push(file);
      this.imagePreviews.push({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file)
      });
    });

    input.value = '';
  }

  removeImage(index: number): void {
    const preview = this.imagePreviews[index];
    if (preview) {
      URL.revokeObjectURL(preview.url);
    }

    this.imagePreviews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please complete all required property details before publishing.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const payload = this.buildPropertyPayload();

    this.propertyService.createProperty(payload).pipe(
      switchMap(property => {
        if (this.selectedFiles.length === 0) {
          return of(property);
        }

        return this.propertyService.uploadPropertyImages(property._id, this.selectedFiles);
      })
    ).subscribe({
      next: property => {
        this.isSubmitting = false;
        this.router.navigate(['/properties', property._id]);
      },
      error: error => {
        console.error('Property creation error:', error);
        this.isSubmitting = false;
        this.error = error.error?.message || 'Property could not be published right now. Please try again.';
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  trackByPreview(index: number, preview: ImagePreview): string {
    return `${index}-${preview.name}-${preview.size}`;
  }

  private buildPropertyPayload(): Record<string, unknown> {
    const value = this.form.getRawValue();
    const features = this.parseFeatures(value.features || '');

    return {
      title: value.title?.trim(),
      description: value.description?.trim(),
      price: Number(value.price),
      city: value.city?.trim(),
      areaName: value.areaName?.trim(),
      address: value.address?.trim(),
      country: value.country?.trim() || 'Pakistan',
      bedrooms: Number(value.bedrooms),
      bathrooms: Number(value.bathrooms),
      areaSqFt: Number(value.areaSqFt),
      areaMarla: Number(value.areaMarla || 0),
      propertyType: value.propertyType,
      purpose: value.purpose,
      propertyAge: Number(value.propertyAge || 0),
      features,
      amenities: features
    };
  }

  private parseFeatures(value: string): string[] {
    return value
      .split(/[\n,]/)
      .map(feature => feature.trim())
      .filter(feature => feature.length > 0);
  }

  private revokePreviewUrls(): void {
    this.imagePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
  }
}
