import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../util/util';

@Injectable({ providedIn: 'root' })
export class StudentGradeApi {
  private http = inject(HttpClient);

  createGrade(studentId: number, dto: { grade: number; description: string }) {
    return this.http.post(`${BASE_URL}/students/${studentId}/grades`, dto);
  }
}
