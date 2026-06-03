import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'EstateIQ';
  showNavbarFooter: boolean = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize theme from localStorage
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Hide navbar and footer on auth page
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showNavbarFooter = !event.url.includes('/auth');
      }
    });
  }
}
