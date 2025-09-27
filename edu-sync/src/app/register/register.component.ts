import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../services/auth.service';

type Role = 'student' | 'trainer' | 'admin';

interface RegisterUserDto {
  email: string;
  password: string;
  role: Role; // now included
}

// Validator: passwords must match
function matchPasswords(
  passKey = 'password',
  confirmKey = 'confirmPassword'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get(passKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    if (pass && confirm && pass !== confirm) {
      group.get(confirmKey)?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    const confirmCtrl = group.get(confirmKey);
    if (confirmCtrl?.hasError('mismatch')) {
      const { mismatch, ...rest } = confirmCtrl.errors ?? {};
      confirmCtrl.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  hidePassword = signal(true);
  hideConfirm = signal(true);

  roleOptions: Role[] = ['student', 'trainer'];

  form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
      role: ['student' as Role, [Validators.required]], // default Student
    },
    { validators: matchPasswords() }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, role } = this.form.getRawValue() as {
      email: string;
      password: string;
      role: Role;
    };

    const payload: RegisterUserDto = { email, password, role };
    this.auth.register(payload).subscribe({
      next: () => {
        // Navigate immediately to login page on successful registration
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        console.error('Registration failed', err);
      },
    });
  }

  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }
  get confirmPassword() {
    return this.form.get('confirmPassword');
  }
  get role() {
    return this.form.get('role');
  }
}
