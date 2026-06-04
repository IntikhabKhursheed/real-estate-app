import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Property, PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { UploadService } from '../../services/upload.service';

interface ImagePreview {
  id: string;
  name: string;
  size: number;
  url: string;
  progress: number;
  status: 'ready' | 'uploading' | 'done' | 'error';
  error?: string;
}

@Component({
  selector: 'app-property-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './property-create.component.html',
  styleUrls: ['./property-create.component.scss']
})
export class PropertyCreateComponent implements OnInit, OnDestroy {
  propertyTypes = ['Apartment', 'House', 'Plot', 'Commercial'];
  purposes = ['Sale', 'Rent'];
  selectedFiles: File[] = [];
  imagePreviews: ImagePreview[] = [];
  existingImages: string[] = [];
  dragActive = false;
  isSubmitting = false;
  isUploadingImages = false;
  isLoadingProperty = false;
  error: string | null = null;
  isEditMode = false;
  editingPropertyId: string | null = null;

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

  private readonly subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private uploadService: UploadService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        const editId = params.get('id');
        this.editingPropertyId = editId;
        this.isEditMode = Boolean(editId);

        if (this.isEditMode && this.editingPropertyId) {
          this.loadPropertyForEdit(this.editingPropertyId);
        } else {
          this.resetForCreateMode();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.revokePreviewUrls();
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Property' : 'Add New Property';
  }

  get pageDescription(): string {
    return this.isEditMode
      ? 'Update the listing details and upload any new images you want to append.'
      : 'Create the listing details, then upload property images before publishing.';
  }

  get submitLabel(): string {
    return this.isEditMode ? 'Save Changes' : 'Publish Property';
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.addFiles(files);

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
    this.addFiles(Array.from(event.dataTransfer?.files || []));
  }

  removeImage(index: number): void {
    const preview = this.imagePreviews[index];
    if (preview) {
      URL.revokeObjectURL(preview.url);
    }

    this.imagePreviews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.existingImages.splice(index, 1);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please complete all required property details before publishing.';
      return;
    }

    if ((this.selectedFiles.length + this.existingImages.length) > 5) {
      this.error = 'You can upload up to 5 images per property.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.uploadSelectedFiles()
      .then(uploadedUrls => {
        const payload = this.buildPropertyPayload(uploadedUrls);
        const save$ = this.isEditMode && this.editingPropertyId
          ? this.propertyService.updateProperty(this.editingPropertyId, payload)
          : this.propertyService.createProperty(payload);

        save$.subscribe({
          next: property => {
            this.isSubmitting = false;
            this.toastService.show(this.isEditMode ? 'Property updated.' : 'Property created.', 'success');
            this.router.navigate(['/properties', property._id]);
          },
          error: error => {
            console.error('Property save error:', error);
            this.isSubmitting = false;
            this.error = error.error?.message || 'Property could not be saved right now. Please try again.';
          }
        });
      })
      .catch(error => {
        console.error('Image upload error:', error);
        this.isSubmitting = false;
        this.error = typeof error === 'string'
          ? error
          : error?.error?.message || 'Images could not be uploaded right now. Please try again.';
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

  trackByRemoteImage(index: number, image: string): string {
    return `${index}-${image}`;
  }

  private loadPropertyForEdit(propertyId: string): void {
    this.isLoadingProperty = true;
    this.error = null;
    this.selectedFiles = [];
    this.revokePreviewUrls();
    this.imagePreviews = [];
    this.existingImages = [];

    this.subscriptions.add(
      this.propertyService.getPropertyById(propertyId).subscribe({
        next: property => {
          this.patchForm(property);
          this.existingImages = property.images || [];
          this.isLoadingProperty = false;
        },
        error: error => {
          console.error('Failed to load property for editing:', error);
          this.error = error.error?.message || 'Unable to load property details for editing.';
          this.isLoadingProperty = false;
        }
      })
    );
  }

  private resetForCreateMode(): void {
    this.existingImages = [];
    this.selectedFiles = [];
    this.error = null;
    this.revokePreviewUrls();
    this.imagePreviews = [];
    this.form.reset({
      title: '',
      description: '',
      price: null,
      city: '',
      areaName: '',
      address: '',
      country: 'Pakistan',
      bedrooms: 0,
      bathrooms: 0,
      areaSqFt: null,
      areaMarla: null,
      propertyType: '',
      purpose: 'Sale',
      propertyAge: 0,
      features: ''
    });
  }

  private patchForm(property: Property): void {
    this.form.patchValue({
      title: property.title || '',
      description: property.description || '',
      price: property.price ?? null,
      city: property.city || '',
      areaName: property.areaName || '',
      address: property.address || '',
      country: property.country || 'Pakistan',
      bedrooms: property.bedrooms ?? 0,
      bathrooms: property.bathrooms ?? 0,
      areaSqFt: property.areaSqFt ?? property.area ?? null,
      areaMarla: property.areaMarla ?? null,
      propertyType: property.propertyType || property.type || '',
      purpose: property.purpose || 'Sale',
      propertyAge: property.propertyAge ?? property.age ?? 0,
      features: (property.features || property.amenities || []).join(', ')
    });
  }

  private addFiles(files: File[]): void {
    this.error = null;

    if (files.length === 0) {
      return;
    }

    const validFiles = files.filter(file => this.isSupportedImage(file));
    if (validFiles.length !== files.length) {
      this.error = 'Only JPG, PNG, and WebP images can be uploaded.';
    }

    const remainingSlots = Math.max(0, 5 - this.selectedFiles.length - this.existingImages.length);
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      this.error = 'You can upload up to 5 images per property.';
    }

    filesToAdd.forEach(file => {
      this.selectedFiles.push(file);
      this.imagePreviews.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        progress: 0,
        status: 'ready'
      });
    });
  }

  private async uploadSelectedFiles(): Promise<string[]> {
    if (this.selectedFiles.length === 0) {
      return [];
    }

    this.isUploadingImages = true;
    const uploadedUrls: string[] = [];

    try {
      for (let index = 0; index < this.selectedFiles.length; index += 1) {
        const preview = this.imagePreviews[index];
        const file = this.selectedFiles[index];

        if (!preview || !file) {
          continue;
        }

        const uploadedUrl = await this.uploadSingleFile(file, preview);
        if (uploadedUrl) {
          uploadedUrls.push(uploadedUrl);
        }
      }
    } finally {
      this.isUploadingImages = false;
    }

    return uploadedUrls;
  }

  private uploadSingleFile(file: File, preview: ImagePreview): Promise<string> {
    return new Promise((resolve, reject) => {
      preview.status = 'uploading';
      preview.progress = 0;

      const subscription = this.uploadService.uploadImage(file).subscribe({
        next: event => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            preview.progress = Math.round((100 * event.loaded) / event.total);
          }

          if (event.type === HttpEventType.Response) {
            const urls = event.body?.data?.urls || [];
            const uploadedUrl = urls[0] || '';
            preview.status = 'done';
            preview.progress = 100;
            resolve(uploadedUrl);
            subscription.unsubscribe();
          }
        },
        error: error => {
          preview.status = 'error';
          preview.error = error?.error?.message || 'Upload failed';
          reject(error);
          subscription.unsubscribe();
        }
      });
    });
  }

  private buildPropertyPayload(uploadedImageUrls: string[]): Record<string, unknown> {
    const value = this.form.getRawValue();
    const features = this.parseFeatures(value.features || '');
    const images = [...this.existingImages, ...uploadedImageUrls].slice(0, 5);

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
      amenities: features,
      images
    };
  }

  private isSupportedImage(file: File): boolean {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
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
