// src/app/core/api/student.api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
const BASE = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class StudentApi {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${BASE}/student`);
  }
  getStudent(id: number) {
    return this.http.get<any>(`${BASE}/student/${id}`);
  }
  updateStudent(id: number, dto: any) {
    return this.http.patch<any>(`${BASE}/student/${id}`, dto);
  }
  delete(id: number) {
    return this.http.delete(`${BASE}/student/${id}`);
  }
  getByAcademy(academyId: number) {
    const params = new HttpParams().set('academyId', String(academyId));
    return this.http.get<any[]>(`${BASE}/student`, { params });
  }
  getMe() {
    return this.http.get<any>(`${BASE}/student/me`);
  }

  updateMe(body: any) {
    return this.http.patch<any>(`${BASE}/student/me`, body);
  }
  updateAcademy(id: number, academyId: number) {
    return this.http.patch(`${BASE}/student/${id}/academy`, { academyId });
  }
  setSubjects(id: number, subjectIds: number[]) {
    return this.http.put(`${BASE}/student/${id}/subjects`, { subjectIds });
  }
}
