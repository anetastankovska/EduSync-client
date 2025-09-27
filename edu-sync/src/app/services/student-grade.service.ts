// src/app/core/api/student-grade.api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
const BASE = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class StudentGradeApi {
  private http = inject(HttpClient);

  // Trainer-auth: POST /students/:studentId/grades
  createGrade(studentId: number, dto: { grade: number; description: string }) {
    return this.http.post(`${BASE}/students/${studentId}/grades`, dto);
  }
}
