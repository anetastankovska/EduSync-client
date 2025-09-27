// src/app/panel/trainer-panel.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AcademyApi } from '../../services/academy.service';
import { AuthService } from '../../services/auth.service';
import { StudentApi } from '../../services/student.service';
import { TrainerApi } from '../../services/trainer.service';
import { StudentGradeApi } from '../../services/student-grade.service';
import { MatOptionModule } from '@angular/material/core';

type Role = 'student' | 'trainer' | 'admin';

// Adjust these to exactly match your BE Seniority enum values, if different.
const SENIORITY_OPTIONS = [
  'assistant',
  'co-trainer',
  'trainer',
  'lead-trainer',
] as const;
type Seniority = (typeof SENIORITY_OPTIONS)[number];

@Component({
  selector: 'app-trainer-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,
  ],
  templateUrl: './trainer-panel.component.html',
  styleUrls: ['./trainer-panel.component.scss'],
})
export class TrainerPanelComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private trainerApi = inject(TrainerApi);
  private academyApi = inject(AcademyApi);
  private studentApi = inject(StudentApi);
  private gradeApi = inject(StudentGradeApi);

  loading = signal(true);
  saving = signal(false);
  grading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  trainerId!: number;
  academy: any | null = null;
  students = signal<Array<{ id: number; name: string; academyId: number }>>([]);

  seniorityOptions = [...SENIORITY_OPTIONS];

  // Trainer details form
  detailForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    age: [18, [Validators.required, Validators.min(18)]],
    seniority: [SENIORITY_OPTIONS[0] as Seniority, [Validators.required]],
  });

  // Grade a student form
  gradeForm = this.fb.group({
    studentId: [null as number | null, [Validators.required]],
    grade: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    description: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    const token = this.auth.token;
    const payload = token
      ? this.decode<{ sub: number; role?: Role }>(token)
      : null;
    if (!payload?.sub || this.auth.role !== 'trainer') {
      this.errorMsg.set('Not authorized as trainer.');
      this.loading.set(false);
      return;
    }
    // you can keep trainerId if you need it elsewhere, but don't use it for /:id
    this.trainerId = Number(payload.sub);
    this.loadAll();
  }

  private loadAll() {
    this.loading.set(true);
    this.errorMsg.set(null);

    // <-- KEY: use /trainer/me
    this.trainerApi.getMe().subscribe({
      next: (trainer) => {
        this.detailForm.patchValue({
          name: trainer.name ?? '',
          email: trainer.email ?? '',
          age: trainer.age ?? 18,
          seniority: trainer.seniority ?? this.seniorityOptions[0],
        });

        const academyId = trainer.academyId;
        if (academyId) {
          this.academyApi.getAcademy(academyId).subscribe({
            next: (a) => (this.academy = a),
            error: () => {},
          });
          this.studentApi.getByAcademy(academyId).subscribe({
            next: (list) => {
              console.log('[TrainerPanel] raw students:', list);
              const mapped = (list ?? []).map((s: any) => ({
                id: s.id,
                name: s.name ?? '',
                academyId: s.academyId,
              }));
              console.log('[TrainerPanel] mapped students:', mapped);
              this.students.set(mapped);
            },
            error: (err) =>
              console.error('[TrainerPanel] getByAcademy error:', err),
            complete: () => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Failed to load trainer.');
        this.loading.set(false);
      },
    });
  }

  saveDetails(): void {
    if (this.detailForm.invalid) {
      this.detailForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

    const dto = this.detailForm.getRawValue();

    // <-- KEY: use /trainer/me
    this.trainerApi.updateMe(dto).subscribe({
      next: () => {
        this.successMsg.set('Trainer details saved.');
        this.saving.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Failed to save details.');
        this.saving.set(false);
      },
    });
  }

  submitGrade(): void {
    if (this.gradeForm.invalid) {
      this.gradeForm.markAllAsTouched();
      return;
    }
    this.grading.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

    const { studentId, grade, description } = this.gradeForm.getRawValue();
    if (!studentId || !grade) {
      this.grading.set(false);
      return;
    }

    // POST /students/:studentId/grades  (trainer-auth)
    this.gradeApi
      .createGrade(studentId, { grade, description: description ?? '' })
      .subscribe({
        next: () => {
          this.successMsg.set('Feedback submitted.');
          this.gradeForm.reset();
          this.grading.set(false);
        },
        error: (err) => {
          this.errorMsg.set(
            err?.error?.message ?? 'Failed to submit feedback.'
          );
          this.grading.set(false);
        },
      });
  }

  // helpers
  private decode<T = any>(token: string): T | null {
    try {
      return JSON.parse(atob(token.split('.')[1])) as T;
    } catch {
      return null;
    }
  }
}
