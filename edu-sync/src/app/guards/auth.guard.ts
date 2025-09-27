// src/app/core/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Require login
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? true : router.parseUrl('/login');
};

// Match role before loading a route (best for lazy/standalone)
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

// Optional: also use as canActivate on already-loaded routes
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

// Smart redirect: /panel -> /panel/<role>
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
