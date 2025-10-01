import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../util/util';

@Injectable({ providedIn: 'root' })
export class StudentApi {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${BASE_URL}/student`);
  }
  getStudent(id: number) {
    return this.http.get<any>(`${BASE_URL}/student/${id}`);
  }
  updateStudent(id: number, dto: any) {
    return this.http.patch<any>(`${BASE_URL}/student/${id}`, dto);
  }
  delete(id: number) {
    return this.http.delete(`${BASE_URL}/student/${id}`);
  }
  getByAcademy(academyId: number) {
    const params = new HttpParams().set('academyId', String(academyId));
    return this.http.get<any[]>(`${BASE_URL}/student`, { params });
  }
  getMe() {
    return this.http.get<any>(`${BASE_URL}/student/me`);
  }
  updateMe(body: any) {
    return this.http.patch<any>(`${BASE_URL}/student/me`, body);
  }

  updateAcademy(id: number, academyId: number | null) {
    return this.http.patch(`${BASE_URL}/student/${id}/academy`, { academyId });
  }
  setSubjects(id: number, subjectIds: number[]) {
    return this.http.put(`${BASE_URL}/student/${id}/subjects`, { subjectIds });
  }
  getBySubject(subjectId: number) {
    return this.http.get<any[]>(`${BASE_URL}?subjectId=${subjectId}`);
  }
}
