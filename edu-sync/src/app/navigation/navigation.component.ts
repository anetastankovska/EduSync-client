// src/app/navigation/navigation.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Observables for template
  isLoggedIn$ = this.auth.jwt$.pipe(map((t) => !!t));
  role$ = this.auth.userRole$; // 'student' | 'trainer' | 'admin' | null

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
