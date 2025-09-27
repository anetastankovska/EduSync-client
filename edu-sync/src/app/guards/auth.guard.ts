import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? true : router.parseUrl('/login');
};

export const matchRole = (
  roles: Array<'admin' | 'trainer' | 'student'>
): CanMatchFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role;
    return role && roles.includes(role) ? true : router.parseUrl('/panel'); // fallback
  };
};

export const requireRole = (
  roles: Array<'admin' | 'trainer' | 'student'>
): CanActivateFn => {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role;
    return role && roles.includes(role) ? true : router.parseUrl('/panel');
  };
};

export const panelAutoRedirect: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.role;
  if (!auth.isLoggedIn) return router.parseUrl('/login');
  switch (role) {
    case 'admin':
      return router.parseUrl('/panel/admin');
    case 'trainer':
      return router.parseUrl('/panel/trainer');
    case 'student':
      return router.parseUrl('/panel/student');
    default:
      return router.parseUrl('/login');
  }
};
