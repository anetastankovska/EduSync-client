import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../util/util';

@Injectable({ providedIn: 'root' })
export class SubjectApi {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${BASE_URL}/subject`);
  }
  getByAcademy(academyId: number) {
    const params = new HttpParams().set('academyId', academyId);
    return this.http.get<any[]>(`${BASE_URL}/subject`, { params });
  }
  create(dto: {
    name: string;
    numberOfClasses: number;
    difficulty: string;
    academyId: number;
  }) {
    return this.http.post<any>(`${BASE_URL}/subject`, dto);
  }
  delete(id: number) {
    return this.http.delete(`${BASE_URL}/subject/${id}`);
  }
}
