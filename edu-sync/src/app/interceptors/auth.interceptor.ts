import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const role = auth.role; // 'student' | 'trainer' | 'admin' | null

  if (!token) return next(req);

  let headers = req.headers.set('Authorization', `Bearer ${token}`);
  if (role) headers = headers.set('x-role', role);

  return next(req.clone({ headers }));
};
