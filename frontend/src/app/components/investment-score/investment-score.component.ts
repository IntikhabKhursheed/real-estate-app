import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvestmentService } from '../../services/investment.service';
import { PropertyService, Property } from '../../services/property.service';

@Component({
  selector: 'app-investment-score',
  standalone: false,
  templateUrl: './investment-score.component.html',
  styleUrls: ['./investment-score.component.css']
})
export class InvestmentScoreComponent implements OnInit {
  propertyId: string | null = null;
  property: Property | null = null;
  investmentData: any = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private investmentService: InvestmentService,
    private propertyService: PropertyService
  ) { }

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id');
    if (this.propertyId) {
      this.loadData();
    } else {
      this.error = 'Property ID not provided';
    }
  }

  loadData(): void {
    if (!this.propertyId) return;

    this.isLoading = true;
    this.error = null;

    // Load both property details and investment score
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (property) => {
        this.property = property;
        this.loadInvestmentScore();
      },
      error: (err) => {
        console.error('Error loading property:', err);
        this.error = 'Failed to load property details';
        this.isLoading = false;
      }
    });
  }

  loadInvestmentScore(): void {
    if (!this.propertyId) return;

    this.investmentService.calculateInvestment(this.propertyId).subscribe({
      next: (data) => {
        this.investmentData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error calculating investment:', err);
        this.error = 'Failed to calculate investment score';
        this.isLoading = false;
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 8) return 'from-green-400 to-emerald-600';
    if (score >= 6) return 'from-blue-400 to-indigo-600';
    if (score >= 4) return 'from-yellow-400 to-orange-600';
    return 'from-red-400 to-pink-600';
  }

  getRecommendationColor(recommendation: string): string {
    if (recommendation.toLowerCase().includes('strong') || recommendation.toLowerCase().includes('excellent')) {
      return 'text-green-600 dark:text-green-400';
    }
    if (recommendation.toLowerCase().includes('good') || recommendation.toLowerCase().includes('moderate')) {
      return 'text-blue-600 dark:text-blue-400';
    }
    if (recommendation.toLowerCase().includes('fair')) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-red-600 dark:text-red-400';
  }

  goBack(): void {
    this.router.navigate(['/properties']);
  }
}
