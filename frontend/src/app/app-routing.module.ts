import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { PropertyListComponent } from './components/property-list/property-list.component';
import { PropertyValuationComponent } from './components/property-valuation/property-valuation.component';
import { PropertySearchComponent } from './components/property-search/property-search.component';
import { InvestmentScoreComponent } from './components/investment-score/investment-score.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthComponent } from './components/auth/auth.component';
import { PropertyCreateComponent } from './pages/property-create/property-create.component';
import { PropertyDetailComponent } from './pages/property-detail/property-detail.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'auth', component: AuthComponent },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard] },
  { path: 'properties', component: PropertyListComponent, canActivate: [AuthGuard] },
  { path: 'properties/new', component: PropertyCreateComponent, canActivate: [AuthGuard] },
  { path: 'properties/:id', component: PropertyDetailComponent, canActivate: [AuthGuard] },
  { path: 'valuation', component: PropertyValuationComponent, canActivate: [AuthGuard] },
  { path: 'search', component: PropertySearchComponent, canActivate: [AuthGuard] },
  { path: 'investment/:id', component: InvestmentScoreComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
