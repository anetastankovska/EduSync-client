import { Routes } from '@angular/router';
import { authGuard, matchRole, panelAutoRedirect } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'programs',
    loadComponent: () =>
      import('./programs/programs.component').then((m) => m.ProgramsComponent),
  },
  {
    path: 'programs/quiz',
    loadComponent: () =>
      import('./programs/interest-quiz/interest-quiz.component').then(
        (m) => m.InterestQuizComponent
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./contact/contact.component').then((m) => m.ContactComponent),
  },

  // Generic panel entry → redirects by role
  {
    path: 'panel',
    canActivate: [panelAutoRedirect],
    // Dummy placeholder component is fine; it never renders because guard redirects.
    loadComponent: () =>
      import('./shared/spinner-loader/spinner-loader.component')
        .then((m) => m.SpinnerLoaderComponent)
        .catch(() => Promise.resolve({ default: () => null } as any)),
  },

  // Admin panel (admin only)
  {
    path: 'panel/admin',
    canMatch: [authGuard, matchRole(['admin'])],
    loadComponent: () =>
      import('./panel/admin-panel/admin-panel.component').then(
        (m) => m.AdminPanelComponent
      ),
  },

  // Trainer panel (trainer only)
  {
    path: 'panel/trainer',
    canMatch: [authGuard, matchRole(['trainer'])],
    loadComponent: () =>
      import('./panel/trainer-panel/trainer-panel.component').then(
        (m) => m.TrainerPanelComponent
      ),
  },

  // Student panel (student only)
  {
    path: 'panel/student',
    canMatch: [authGuard, matchRole(['student'])],
    loadComponent: () =>
      import('./panel/student-panel/student-panel.component').then(
        (m) => m.StudentPanelComponent
      ),
  },

  // Keep wildcard last
  {
    path: '**',
    loadComponent: () =>
      import('./shared/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
