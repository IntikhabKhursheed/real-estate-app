import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: any = null;
  isDarkMode = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isDarkMode = document.body.classList.contains('dark');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  getInitial(): string {
    return this.currentUser?.fullName?.charAt(0)?.toUpperCase() || 'U';
  }
}
