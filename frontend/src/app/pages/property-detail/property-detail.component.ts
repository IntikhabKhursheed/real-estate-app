import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { InvestmentResponse, InvestmentService } from '../../services/investment.service';
import { MortgageCalculatorComponent } from '../../components/mortgage-calculator/mortgage-calculator.component';
import { Agent, Property, PropertyService } from '../../services/property.service';
import { ValuationRequest, ValuationResponse, ValuationService } from '../../services/valuation.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MortgageCalculatorComponent],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.scss']
})
export class PropertyDetailComponent implements OnInit, OnDestroy {
  propertyId: string | null = null;
  property: Property | null = null;
  investment: InvestmentResponse | null = null;
  valuation: ValuationResponse | null = null;
  currentUser: any = null;
  deleteConfirmOpen = false;
  isDeleting = false;
  lightboxOpen = false;
  lightboxIndex = 0;
  brokenImageUrls = new Set<string>();

  isPropertyLoading = true;
  isInvestmentLoading = false;
  isValuationLoading = false;

  propertyError: string | null = null;
  investmentError: string | null = null;
  valuationError: string | null = null;

  private readonly subscriptions = new Subscription();
  private readonly squareFeetPerMarla = 272.25;

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
    private investmentService: InvestmentService,
    private valuationService: ValuationService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => this.currentUser = user)
    );

    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        this.propertyId = params.get('id');

        if (!this.propertyId) {
          this.isPropertyLoading = false;
          this.propertyError = 'Property not found. Please go back to listings and try again.';
          return;
        }

        this.loadProperty();
      })
    );
  }

  canManageProperty(): boolean {
    if (!this.property || !this.currentUser) {
      return false;
    }

    if (this.currentUser.role === 'admin') {
      return true;
    }

    const ownerId = this.getPropertyOwnerId();
    const currentUserId = this.currentUser._id || this.currentUser.id;
    return Boolean(ownerId && currentUserId && ownerId === currentUserId);
  }

  openDeleteConfirm(): void {
    this.deleteConfirmOpen = true;
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmOpen = false;
  }

  editProperty(): void {
    if (!this.propertyId) {
      return;
    }

    this.router.navigate(['/properties', this.propertyId, 'edit']);
  }

  confirmDelete(): void {
    if (!this.propertyId) {
      return;
    }

    this.isDeleting = true;
    this.propertyService.deleteProperty(this.propertyId).subscribe({
      next: () => {
        this.toastService.show('Property deleted.', 'error');
        this.isDeleting = false;
        this.deleteConfirmOpen = false;
        this.router.navigate(['/properties']);
      },
      error: error => {
        this.isDeleting = false;
        this.toastService.show(error.error?.message || 'Unable to delete the property.', 'error');
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadProperty(): void {
    if (!this.propertyId) {
      return;
    }

    this.isPropertyLoading = true;
    this.propertyError = null;
    this.property = null;
    this.investment = null;
    this.valuation = null;

    this.subscriptions.add(
      this.propertyService.getPropertyById(this.propertyId).subscribe({
        next: property => {
          this.property = property;
          this.brokenImageUrls.clear();
          this.lightboxIndex = 0;
          this.isPropertyLoading = false;
          this.loadInvestmentScore();
          this.loadValuation();
        },
        error: error => {
          console.error('Property detail load error:', error);
          this.propertyError = error.error?.message || 'Unable to load this property right now.';
          this.isPropertyLoading = false;
        }
      })
    );
  }

  loadInvestmentScore(): void {
    if (!this.propertyId) {
      return;
    }

    this.isInvestmentLoading = true;
    this.investmentError = null;

    this.subscriptions.add(
      this.investmentService.getInvestmentScore(this.propertyId).subscribe({
        next: investment => {
          this.investment = investment;
          this.isInvestmentLoading = false;
        },
        error: error => {
          console.error('Investment score load error:', error);
          this.investment = this.buildLocalInvestmentFallback();
          this.investmentError = null;
          this.isInvestmentLoading = false;
        }
      })
    );
  }

  loadValuation(): void {
    if (!this.property) {
      return;
    }

    this.isValuationLoading = true;
    this.valuationError = null;

    const valuationRequest: ValuationRequest = {
      city: this.property.city || 'Unknown',
      country: this.property.country || 'Pakistan',
      propertyType: this.propertyTypeLabel,
      bedrooms: this.property.bedrooms || 0,
      bathrooms: this.property.bathrooms || 0,
      areaSqFt: this.areaSqFt,
      propertyAge: this.property.propertyAge ?? this.property.age ?? 0,
      amenities: this.features
    };

    this.subscriptions.add(
      this.valuationService.estimateProperty(valuationRequest).subscribe({
        next: valuation => {
          this.valuation = valuation;
          this.isValuationLoading = false;
        },
        error: error => {
          console.error('Valuation load error:', error);
          this.valuation = this.buildLocalValuationFallback();
          this.valuationError = null;
          this.isValuationLoading = false;
        }
      })
    );
  }

  get heroImage(): string | null {
    const images = this.property?.images;
    if (!images || images.length === 0) {
      return null;
    }

    const image = images[0];
    return image && !this.brokenImageUrls.has(image) ? image : null;
  }

  get galleryImages(): string[] {
    return (this.property?.images || []).filter(image => image && !this.brokenImageUrls.has(image));
  }

  get currentLightboxImage(): string | null {
    if (this.galleryImages.length === 0) {
      return null;
    }

    const safeIndex = Math.max(0, Math.min(this.lightboxIndex, this.galleryImages.length - 1));
    return this.galleryImages[safeIndex] || null;
  }

  get propertyTypeLabel(): string {
    return this.property?.propertyType || this.property?.type || 'Property';
  }

  get purposeLabel(): string {
    return this.property?.purpose || 'Sale';
  }

  get areaSqFt(): number {
    return Number(this.property?.areaSqFt ?? this.property?.area ?? 0);
  }

  get areaMarla(): number {
    const explicitMarla = Number(this.property?.areaMarla ?? 0);
    if (explicitMarla > 0) {
      return explicitMarla;
    }

    return this.areaSqFt > 0 ? this.areaSqFt / this.squareFeetPerMarla : 0;
  }

  get areaLabel(): string {
    const sqFt = this.areaSqFt;
    const marla = this.areaMarla;

    if (marla > 0 && sqFt > 0) {
      return `${this.formatNumber(marla, 1)} marla / ${this.formatNumber(sqFt)} sqft`;
    }

    if (sqFt > 0) {
      return `${this.formatNumber(sqFt)} sqft`;
    }

    return 'Area not listed';
  }

  get locationLine(): string {
    const parts = [
      this.property?.areaName,
      this.property?.city
    ].filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join(', ') : 'Location not listed';
  }

  get addressLine(): string {
    return this.property?.address || this.property?.country || 'Address not listed';
  }

  get features(): string[] {
    const features = this.property?.features;
    if (features && features.length > 0) {
      return features;
    }

    return this.property?.amenities || [];
  }

  get agentDetails(): Agent | null {
    const createdBy = this.property?.createdBy;
    if (createdBy && typeof createdBy === 'object') {
      return createdBy;
    }

    return this.property?.agent || null;
  }

  get agentName(): string {
    return this.agentDetails?.fullName || this.agentDetails?.name || 'EstateIQ Agent';
  }

  get agentEmail(): string {
    return this.agentDetails?.email || '';
  }

  get agentPhone(): string {
    return this.agentDetails?.phone || '';
  }

  private getPropertyOwnerId(): string {
    const createdBy = this.property?.createdBy;
    if (typeof createdBy === 'string') {
      return createdBy;
    }

    return createdBy?._id || createdBy?.id || '';
  }

  get investmentScore(): number {
    const rawScore = Number(this.investment?.score ?? this.investment?.investmentScore ?? 0);
    if (!Number.isFinite(rawScore)) {
      return 0;
    }

    const normalizedScore = rawScore <= 10 ? rawScore * 10 : rawScore;
    return Math.max(0, Math.min(100, Math.round(normalizedScore)));
  }

  get investmentLabel(): string {
    return this.getScoreLabel(this.investmentScore);
  }

  get pricePerSqFt(): string {
    if (!this.property || this.areaSqFt <= 0) {
      return 'PKR 0';
    }

    return this.formatCurrency(this.property.price / this.areaSqFt);
  }

  get valuationReasoning(): string[] {
    const reasoning = this.valuation?.reasoning as unknown;
    return this.toTextList(reasoning);
  }

  get investmentReasoning(): string[] {
    return this.toTextList(this.investment?.reasoning);
  }

  get valuationRating(): string {
    const rating = this.valuation?.investmentRating as unknown;
    if (typeof rating === 'number') {
      return `${rating}/10`;
    }

    return typeof rating === 'string' && rating.length > 0 ? rating : 'Pending';
  }

  formatCurrency(value: number | undefined): string {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'PKR 0';
    }

    return `PKR ${this.formatNumber(amount)}`;
  }

  formatConfidence(confidence: number | string | undefined): string {
    if (typeof confidence === 'string') {
      return confidence;
    }

    if (typeof confidence === 'number' && Number.isFinite(confidence)) {
      const percent = confidence <= 1 ? confidence * 100 : confidence;
      return `${Math.round(percent)}%`;
    }

    return 'Pending';
  }

  formatNumber(value: number, maximumFractionDigits = 0): string {
    return new Intl.NumberFormat('en-PK', {
      maximumFractionDigits
    }).format(value);
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  getScoreTextClass(score: number): string {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  getScoreBadgeClass(score: number): string {
    if (score >= 80) return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    if (score >= 60) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  }

  getScoreBarClass(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  trackByText(index: number, value: string): string {
    return `${index}-${value}`;
  }

  markImageBroken(url: string): void {
    if (url) {
      this.brokenImageUrls.add(url);
    }
  }

  openLightbox(index: number): void {
    if (this.galleryImages.length === 0) {
      return;
    }

    this.lightboxIndex = Math.max(0, Math.min(index, this.galleryImages.length - 1));
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  nextImage(): void {
    if (this.galleryImages.length === 0) {
      return;
    }

    this.lightboxIndex = (this.lightboxIndex + 1) % this.galleryImages.length;
  }

  previousImage(): void {
    if (this.galleryImages.length === 0) {
      return;
    }

    this.lightboxIndex = (this.lightboxIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
  }

  private toTextList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter(item => item.trim().length > 0);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return [value];
    }

    return [];
  }

  private buildLocalInvestmentFallback(): InvestmentResponse {
    const score = this.calculateLocalInvestmentScore();
    return {
      investmentScore: score,
      score,
      confidence: 'Low',
      reasoning: [
        'AI analysis is temporarily unavailable, so this is a conservative local fallback.',
        `Based on ${this.property?.bedrooms || 0} bedrooms, ${this.property?.bathrooms || 0} bathrooms, and ${this.areaSqFt || 0} sq ft.`,
        this.property?.city ? `Location adjustment applied for ${this.property.city}.` : 'No location adjustment was available.',
        `Property type considered as ${this.propertyTypeLabel}.`,
        Array.isArray(this.features) && this.features.length > 0
          ? 'Amenities and features contributed a small positive adjustment.'
          : 'No features were provided for extra uplift.'
      ]
    };
  }

  private buildLocalValuationFallback(): ValuationResponse {
    const estimatedPrice = this.calculateLocalValuationEstimate();
    return {
      estimatedPrice,
      confidence: 0.25,
      investmentRating: 'Fallback estimate',
      reasoning: [
        'AI valuation is temporarily unavailable, so this is a conservative local fallback.',
        `Based on ${this.property?.bedrooms || 0} bedrooms, ${this.property?.bathrooms || 0} bathrooms, and ${this.areaSqFt || 0} sq ft.`,
        this.property?.city ? `City adjustment applied for ${this.property.city}.` : 'No city-specific adjustment was available.',
        `Property type considered as ${this.propertyTypeLabel}.`
      ].join(' ')
    };
  }

  private calculateLocalInvestmentScore(): number {
    const areaSqFt = this.areaSqFt || 0;
    const price = Number(this.property?.price || 0);
    let score = 55;

    if (areaSqFt > 0) {
      const pricePerSqFt = price / areaSqFt;
      if (pricePerSqFt < 15000) score += 12;
      else if (pricePerSqFt < 25000) score += 6;
      else if (pricePerSqFt > 40000) score -= 10;
    }

    if ((this.property?.bedrooms || 0) >= 3) score += 4;
    if ((this.property?.bathrooms || 0) >= 2) score += 3;
    if ((this.property?.propertyAge ?? this.property?.age ?? 0) <= 10) score += 4;
    if (Array.isArray(this.features) && this.features.length > 0) score += Math.min(this.features.length, 4);
    if (['lahore', 'karachi', 'islamabad', 'rawalpindi'].includes((this.property?.city || '').toLowerCase())) score += 3;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateLocalValuationEstimate(): number {
    const areaSqFt = this.areaSqFt || 0;
    const pricePerSqFt = this.propertyTypeLabel.toLowerCase() === 'commercial'
      ? 14000
      : this.propertyTypeLabel.toLowerCase() === 'apartment'
        ? 12500
        : this.propertyTypeLabel.toLowerCase() === 'plot'
          ? 9000
          : 12000;

    const cityMultiplier = ['islamabad', 'rawalpindi'].includes((this.property?.city || '').toLowerCase())
      ? 1.12
      : ['lahore', 'karachi'].includes((this.property?.city || '').toLowerCase())
        ? 1.08
        : 1.0;

    const amenitiesBonus = Array.isArray(this.features) ? Math.min(this.features.length, 6) * 35000 : 0;
    const baseEstimate = areaSqFt * pricePerSqFt * cityMultiplier;

    return Math.max(0, Math.round(baseEstimate + amenitiesBonus));
  }
}
