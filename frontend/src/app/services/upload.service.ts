import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UploadImagesResponse {
  urls: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private readonly uploadUrl = 'http://localhost:5000/api/upload';

  constructor(private http: HttpClient) { }

  uploadImage(file: File): Observable<HttpEvent<ApiResponse<UploadImagesResponse>>> {
    const formData = new FormData();
    formData.append('images', file);

    return this.http.post<ApiResponse<UploadImagesResponse>>(this.uploadUrl, formData, {
      observe: 'events',
      reportProgress: true
    });
  }

  uploadImages(files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    return this.http.post<ApiResponse<UploadImagesResponse>>(this.uploadUrl, formData).pipe(
      map(response => response.data?.urls || [])
    );
  }

  isProgressEvent(event: HttpEvent<ApiResponse<UploadImagesResponse>>): boolean {
    return event.type === HttpEventType.UploadProgress;
  }
}
