import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: any = null;
  isDarkMode = false;
  isLoading = false;
  profileForm!: FormGroup;
  joinDateLabel = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isDarkMode = document.body.classList.contains('dark');
    this.joinDateLabel = this.formatJoinDate(this.currentUser?.createdAt);
    this.profileForm = this.fb.group({
      fullName: [this.currentUser?.fullName || '', [Validators.required, Validators.minLength(2)]],
      phone: [this.currentUser?.phone || '']
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.updateProfile({
      fullName: this.profileForm.value.fullName,
      phone: this.profileForm.value.phone
    }).subscribe({
      next: (user) => {
        this.currentUser = { ...this.currentUser, ...user };
        this.profileForm.patchValue({
          fullName: user.fullName,
          phone: user.phone || ''
        });
        this.joinDateLabel = this.formatJoinDate(user?.createdAt || this.currentUser?.createdAt);
        this.toastService.show('Profile updated.', 'success');
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.show(error.error?.message || 'Unable to update profile.', 'error');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  getInitial(): string {
    return this.currentUser?.fullName?.charAt(0)?.toUpperCase() || 'U';
  }

  private formatJoinDate(dateValue?: string): string {
    if (!dateValue) {
      return 'Unknown';
    }

    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
