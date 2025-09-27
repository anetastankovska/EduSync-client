import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
const BASE = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class TrainerApi {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${BASE}/trainer`);
  }
  getTrainer(id: number) {
    return this.http.get<any>(`${BASE}/trainer/${id}`);
  }
  updateTrainer(id: number, dto: any) {
    return this.http.patch<any>(`${BASE}/trainer/${id}`, dto);
  }
  delete(id: number) {
    return this.http.delete(`${BASE}/trainer/${id}`);
  }
  getByAcademy(academyId: number) {
    // FIX: HttpParams takes strings
    const params = new HttpParams().set('academyId', String(academyId));
    return this.http.get<any[]>(`${BASE}/trainer`, { params });
  }
  getMe() {
    return this.http.get<any>(`${BASE}/trainer/me`);
  }
  updateMe(body: any) {
    return this.http.patch<any>(`${BASE}/trainer/me`, body);
  }

  // Allow null to unassign
  updateAcademy(id: number, academyId: number | null) {
    return this.http.patch(`${BASE}/trainer/${id}/academy`, { academyId });
  }
  setSubjects(id: number, subjectIds: number[]) {
    // You used PUT; that's fine. (PATCH would also be fine)
    return this.http.put(`${BASE}/trainer/${id}/subjects`, { subjectIds });
  }
}
