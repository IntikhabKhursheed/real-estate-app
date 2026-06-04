import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastId = 0;
  private readonly maxToasts = 3;
  private toastsSubject = new BehaviorSubject<ToastItem[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const toast: ToastItem = {
      id: ++this.toastId,
      message,
      type
    };

    const nextToasts = [toast, ...this.toastsSubject.value].slice(0, this.maxToasts);
    this.toastsSubject.next(nextToasts);

    window.setTimeout(() => this.remove(toast.id), duration);
  }

  remove(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(toast => toast.id !== id));
  }
}
