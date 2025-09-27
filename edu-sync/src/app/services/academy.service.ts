import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
const BASE = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class AcademyApi {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${BASE}/academy`);
  }
  getAcademy(id: number) {
    return this.http.get<any>(`${BASE}/academy/${id}`);
  }
  create(dto: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    price: number;
  }) {
    return this.http.post<any>(`${BASE}/academy`, dto);
  }
  delete(id: number) {
    return this.http.delete(`${BASE}/academy/${id}`);
  }
}
