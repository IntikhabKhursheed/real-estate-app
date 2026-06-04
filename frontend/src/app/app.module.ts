import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Components
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { PropertyValuationComponent } from './components/property-valuation/property-valuation.component';
import { PropertySearchComponent } from './components/property-search/property-search.component';
import { InvestmentScoreComponent } from './components/investment-score/investment-score.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthComponent } from './components/auth/auth.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ToastComponent } from './components/toast/toast.component';

// Services
import { PropertyService } from './services/property.service';
import { ValuationService } from './services/valuation.service';
import { InvestmentService } from './services/investment.service';
import { AuthService } from './services/auth.service';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    HomeComponent,
    PropertyValuationComponent,
    PropertySearchComponent,
    InvestmentScoreComponent,
    LoginComponent,
    RegisterComponent,
    AuthComponent,
    ProfileComponent,
    ToastComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  providers: [
    PropertyService,
    ValuationService,
    InvestmentService,
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
