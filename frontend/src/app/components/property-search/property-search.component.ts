import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PropertyService, Property } from '../../services/property.service';

@Component({
  selector: 'app-property-search',
  standalone: false,
  templateUrl: './property-search.component.html',
  styleUrls: ['./property-search.component.css']
})
export class PropertySearchComponent implements OnInit {
  form!: FormGroup;
  results: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  hasSearched: boolean = false;
  aiReasoning: string | null = null;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      query: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSearch(): void {
    if (this.form.invalid) {
      this.error = 'Please enter a search query (minimum 3 characters)';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.results = [];
    this.aiReasoning = null;

    const query = this.form.get('query')?.value;

    this.propertyService.searchProperties(query).subscribe({
      next: (response) => {
        this.results = response.results || [];
        this.aiReasoning = response.reasoning || null;
        this.hasSearched = true;
        this.isLoading = false;

        if (this.results.length === 0) {
          this.error = 'No properties found matching your search.';
        }
      },
      error: (err) => {
        console.error('Search error:', err);
        this.error = err.error?.message || 'Search failed. Please try again.';
        this.isLoading = false;
        this.hasSearched = true;
      }
    });
  }

  clearSearch(): void {
    this.form.reset();
    this.results = [];
    this.error = null;
    this.hasSearched = false;
    this.aiReasoning = null;
  }

  exampleSearch(query: string): void {
    this.form.patchValue({ query });
    setTimeout(() => this.onSearch(), 100);
  }
}
