import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-mortgage-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mortgage-calculator.component.html',
  styleUrls: ['./mortgage-calculator.component.css']
})
export class MortgageCalculatorComponent implements OnChanges {
  @Input() propertyPrice = 0;

  loanTerms = [5, 10, 15, 20, 25];

  form = this.fb.group({
    price: [0],
    downPaymentPercent: [20],
    loanTermYears: [15],
    interestRate: [18],
    bankName: ['']
  });

  constructor(private fb: FormBuilder) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyPrice']) {
      this.form.patchValue({
        price: Number(this.propertyPrice || 0)
      }, { emitEvent: false });
    }
  }

  get price(): number {
    return Number(this.form.get('price')?.value || 0);
  }

  get downPaymentPercent(): number {
    return Number(this.form.get('downPaymentPercent')?.value || 0);
  }

  get loanTermYears(): number {
    return Number(this.form.get('loanTermYears')?.value || 0);
  }

  get interestRate(): number {
    return Number(this.form.get('interestRate')?.value || 0);
  }

  get bankName(): string {
    return String(this.form.get('bankName')?.value || '').trim();
  }

  get downPaymentAmount(): number {
    return this.price * (this.downPaymentPercent / 100);
  }

  get loanAmount(): number {
    return Math.max(0, this.price - this.downPaymentAmount);
  }

  get monthlyRate(): number {
    return (this.interestRate / 100) / 12;
  }

  get numberOfPayments(): number {
    return this.loanTermYears * 12;
  }

  get monthlyInstallment(): number {
    const principal = this.loanAmount;
    const monthlyRate = this.monthlyRate;
    const payments = this.numberOfPayments;

    if (principal <= 0 || payments <= 0) {
      return 0;
    }

    if (monthlyRate === 0) {
      return principal / payments;
    }

    const factor = Math.pow(1 + monthlyRate, payments);
    return principal * (monthlyRate * factor) / (factor - 1);
  }

  get totalPayment(): number {
    return this.monthlyInstallment * this.numberOfPayments + this.downPaymentAmount;
  }

  get totalInterest(): number {
    return Math.max(0, this.monthlyInstallment * this.numberOfPayments - this.loanAmount);
  }

  get monthlyInstallmentFormatted(): string {
    return this.formatCurrency(this.monthlyInstallment);
  }

  get totalPaymentFormatted(): string {
    return this.formatCurrency(this.totalPayment);
  }

  get totalInterestFormatted(): string {
    return this.formatCurrency(this.totalInterest);
  }

  get downPaymentFormatted(): string {
    return this.formatCurrency(this.downPaymentAmount);
  }

  get loanAmountFormatted(): string {
    return this.formatCurrency(this.loanAmount);
  }

  get priceFormatted(): string {
    return this.formatCurrency(this.price);
  }

  get bankLabel(): string {
    return this.bankName.length > 0 ? this.bankName : 'default market rate';
  }

  formatCurrency(value: number): string {
    return `PKR ${new Intl.NumberFormat('en-PK', {
      maximumFractionDigits: 0
    }).format(Math.max(0, value))}`;
  }
}
