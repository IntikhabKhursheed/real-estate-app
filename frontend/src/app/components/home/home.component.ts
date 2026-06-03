import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredProperties: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private propertyService: PropertyService) { }

  ngOnInit(): void {
    this.loadFeaturedProperties();
  }

  loadFeaturedProperties(): void {
    this.isLoading = true;
    this.error = null;

    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        // Get first 3 properties as featured
        this.featuredProperties = (properties || []).slice(0, 3);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.error = 'Failed to load featured properties';
        this.isLoading = false;
      }
    });
  }
}
