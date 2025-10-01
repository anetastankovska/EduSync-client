import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../util/util';

@Injectable({ providedIn: 'root' })
export class TrainerApi {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${BASE_URL}/trainer`);
  }
  getTrainer(id: number) {
    return this.http.get<any>(`${BASE_URL}/trainer/${id}`);
  }
  updateTrainer(id: number, dto: any) {
    return this.http.patch<any>(`${BASE_URL}/trainer/${id}`, dto);
  }
  delete(id: number) {
    return this.http.delete(`${BASE_URL}/trainer/${id}`);
  }
  getByAcademy(academyId: number) {
    // FIX: HttpParams takes strings
    const params = new HttpParams().set('academyId', String(academyId));
    return this.http.get<any[]>(`${BASE_URL}/trainer`, { params });
  }
  getMe() {
    return this.http.get<any>(`${BASE_URL}/trainer/me`);
  }
  updateMe(body: any) {
    return this.http.patch<any>(`${BASE_URL}/trainer/me`, body);
  }

  // Allow null to unassign
  updateAcademy(id: number, academyId: number | null) {
    return this.http.patch(`${BASE_URL}/trainer/${id}/academy`, { academyId });
  }
  setSubjects(id: number, subjectIds: number[]) {
    return this.http.put(`${BASE_URL}/trainer/${id}/subjects`, { subjectIds });
  }

  getBySubject(subjectId: number) {
    return this.http.get<any[]>(`${BASE_URL}?subjectId=${subjectId}`);
  }
}
