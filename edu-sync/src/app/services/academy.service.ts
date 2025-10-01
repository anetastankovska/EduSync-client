import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../util/util';

@Injectable({ providedIn: 'root' })
export class AcademyApi {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${BASE_URL}/academy`);
  }
  getAcademy(id: number) {
    return this.http.get<any>(`${BASE_URL}/academy/${id}`);
  }
  create(dto: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    price: number;
  }) {
    return this.http.post<any>(`${BASE_URL}/academy`, dto);
  }
  delete(id: number) {
    return this.http.delete(`${BASE_URL}/academy/${id}`);
  }
}
