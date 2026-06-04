import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isDarkMode: boolean = false;
  isMenuOpen: boolean = false;
  isAuthenticated: boolean = false;
  currentUser: any = null;
  isDropdownOpen: boolean = false;
  private destroy$ = new Subject<void>();
  @ViewChild('dropdownMenu') dropdownMenu?: ElementRef<HTMLElement>;
  @ViewChild('dropdownToggle') dropdownToggle?: ElementRef<HTMLElement>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark' || (!savedTheme && this.prefersDarkMode());
    this.applyTheme();

    // Subscribe to auth state
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleProfileMenu(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  goToProfile(): void {
    this.closeProfileMenu();
    this.router.navigate(['/profile']);
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  closeProfileMenu(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeProfileMenu();
    this.closeMenu();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private applyTheme(): void {
    const root = document.body;
    if (this.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  private prefersDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const clickedProfileToggle = this.dropdownToggle?.nativeElement.contains(target);
    const clickedProfileMenu = this.dropdownMenu?.nativeElement.contains(target);

    if (!clickedProfileToggle && !clickedProfileMenu) {
      this.closeProfileMenu();
    }
  }
}
