import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Property, AgentDashboardResponse, PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summary = {
    totalListings: 0,
    activeListings: 0,
    totalViews: 0
  };

  properties: Property[] = [];
  recentInquiries: AgentDashboardResponse['recentInquiries'] = [];
  isLoading = true;
  actionLoadingId: string | null = null;
  error: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.error = null;

    this.propertyService.getAgentDashboard().subscribe({
      next: data => {
        this.summary = data.summary;
        this.properties = data.properties;
        this.recentInquiries = data.recentInquiries;
        this.isLoading = false;
      },
      error: error => {
        console.error('Dashboard load error:', error);
        this.error = error.error?.message || 'Unable to load the dashboard right now.';
        this.isLoading = false;
      }
    });
  }

  toggleStatus(property: Property): void {
    const currentStatus = property.status === 'Inactive' ? 'Inactive' : 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    this.actionLoadingId = property._id;

    this.propertyService.updatePropertyStatus(property._id, nextStatus).subscribe({
      next: updated => {
        this.properties = this.properties.map(item => item._id === updated._id ? {
          ...item,
          ...updated
        } : item);
        this.summary.activeListings = this.properties.filter(item => item.status === 'Active').length;
        this.actionLoadingId = null;
        this.toastService.show(`Property ${updated.status === 'Active' ? 'activated' : 'deactivated'}.`, 'success');
      },
      error: error => {
        console.error('Status update error:', error);
        this.error = error.error?.message || 'Unable to change the property status.';
        this.actionLoadingId = null;
        this.toastService.show(this.error || 'Unable to change the property status.', 'error');
      }
    });
  }

  editProperty(property: Property): void {
    this.router.navigate(['/properties', property._id, 'edit']);
  }

  deleteProperty(property: Property): void {
    const confirmed = window.confirm(`Delete "${property.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.actionLoadingId = property._id;
    this.propertyService.deleteProperty(property._id).subscribe({
      next: () => {
        this.properties = this.properties.filter(item => item._id !== property._id);
        this.summary.totalListings = this.properties.length;
        this.summary.activeListings = this.properties.filter(item => item.status === 'Active').length;
        this.summary.totalViews = this.properties.reduce((sum, item) => sum + Number(item.views || 0), 0);
        this.actionLoadingId = null;
        this.toastService.show('Property deleted.', 'error');
      },
      error: error => {
        console.error('Delete error:', error);
        this.error = error.error?.message || 'Unable to delete the property.';
        this.actionLoadingId = null;
        this.toastService.show(this.error || 'Unable to delete the property.', 'error');
      }
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    return status === 'Active'
      ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }

  getStatusToggleLabel(status: string | undefined): string {
    return status === 'Active' ? 'Deactivate' : 'Activate';
  }

  formatCurrency(value: number | undefined): string {
    return `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
  }
}
