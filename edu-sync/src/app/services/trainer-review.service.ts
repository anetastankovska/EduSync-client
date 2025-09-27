import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
const BASE = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class TrainerReviewApi {
  private http = inject(HttpClient);

  createReview(trainerId: number, dto: { grade: number; description: string }) {
    return this.http.post(`${BASE}/trainer-review/${trainerId}`, dto);
  }
}
