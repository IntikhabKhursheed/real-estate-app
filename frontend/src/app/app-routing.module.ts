import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { PropertyListComponent } from './components/property-list/property-list.component';
import { PropertyValuationComponent } from './components/property-valuation/property-valuation.component';
import { PropertySearchComponent } from './components/property-search/property-search.component';
import { InvestmentScoreComponent } from './components/investment-score/investment-score.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'properties', component: PropertyListComponent },
  { path: 'valuation', component: PropertyValuationComponent },
  { path: 'search', component: PropertySearchComponent },
  { path: 'investment/:id', component: InvestmentScoreComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
