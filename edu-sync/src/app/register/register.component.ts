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
import { RouterLink } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface RegisterUserDto {
  email: string;
  password: string;
  // role intentionally omitted — BE defaults to Role.User
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
    // Clear mismatch if previously set and now matches
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
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  hidePassword = signal(true);
  hideConfirm = signal(true);

  form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchPasswords() }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue() as {
      email: string;
      password: string;
    };
    const payload: RegisterUserDto = { email, password };

    // TODO: AuthService.register(payload).subscribe(...)
    console.log('REGISTER payload', payload);
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
}
