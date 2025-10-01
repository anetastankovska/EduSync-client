import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../util/util';

@Injectable({ providedIn: 'root' })
export class TrainerReviewApi {
  private http = inject(HttpClient);

  createReview(trainerId: number, dto: { grade: number; description: string }) {
    return this.http.post(`${BASE_URL}/trainer-review/${trainerId}`, dto);
  }
}
