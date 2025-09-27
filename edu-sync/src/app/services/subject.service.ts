// src/app/core/api/subject.api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
const BASE = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class SubjectApi {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${BASE}/subject`);
  }
  getByAcademy(academyId: number) {
    const params = new HttpParams().set('academyId', academyId);
    return this.http.get<any[]>(`${BASE}/subject`, { params });
  }
  create(dto: {
    name: string;
    numberOfClasses: number;
    difficulty: string;
    academyId: number;
  }) {
    return this.http.post<any>(`${BASE}/subject`, dto);
  }
  delete(id: number) {
    return this.http.delete(`${BASE}/subject/${id}`);
  }
}
