import { Component, OnInit } from '@angular/core';
import { PropertyService, Property } from '../../services/property.service';

@Component({
  selector: 'app-property-list',
  standalone: false,
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css']
})
export class PropertyListComponent implements OnInit {
  properties: Property[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  sortBy: string = 'title';

  constructor(private propertyService: PropertyService) { }

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.error = null;

    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        this.properties = properties;
        this.sortProperties();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.error = 'Failed to load properties. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  sortProperties(): void {
    switch (this.sortBy) {
      case 'price-low':
        this.properties.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.properties.sort((a, b) => b.price - a.price);
        break;
      case 'area':
        this.properties.sort((a, b) => b.area - a.area);
        break;
      default:
        this.properties.sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  onSortChange(): void {
    this.sortProperties();
  }
}
