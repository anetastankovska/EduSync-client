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
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AcademyApi } from '../../services/academy.service';
import { AuthService } from '../../services/auth.service';
import { StudentApi } from '../../services/student.service';
import { TrainerApi } from '../../services/trainer.service';
import { StudentGradeApi } from '../../services/student-grade.service';
import { SubjectApi } from '../../services/subject.service'; // <-- NEW

type Role = 'student' | 'trainer' | 'admin';

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
    MatSnackBarModule,
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
  private subjectApi = inject(SubjectApi); // <-- NEW
  private gradeApi = inject(StudentGradeApi);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  grading = signal(false);

  trainerId!: number;
  academy: any | null = null;
  students = signal<Array<{ id: number; name: string; academyId: number }>>([]);

  // subjects for trainer’s academy
  mySubjects = signal<
    Array<{
      id: number;
      name: string;
      numberOfClasses?: number;
      difficulty?: string;
    }>
  >([]); // <-- NEW

  seniorityOptions = [...SENIORITY_OPTIONS];

  detailForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    age: [18, [Validators.required, Validators.min(18)]],
    seniority: [SENIORITY_OPTIONS[0] as Seniority, [Validators.required]],
  });

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
      this.toast('Not authorized as trainer.', 'error');
      this.loading.set(false);
      return;
    }
    this.trainerId = Number(payload.sub);
    this.loadAll();
  }

  private loadAll() {
    this.loading.set(true);

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
          // academy card
          this.academyApi
            .getAcademy(academyId)
            .subscribe({ next: (a) => (this.academy = a) });

          // students in my academy
          this.studentApi.getByAcademy(academyId).subscribe({
            next: (list) => {
              this.students.set(
                (list ?? []).map((s: any) => ({
                  id: s.id,
                  name: s.name ?? '',
                  academyId: s.academyId,
                }))
              );
            },
            error: (err) =>
              this.toast(
                err?.error?.message ?? 'Failed to load students.',
                'error'
              ),
          });

          // subjects for my academy (THIS is the change)
          this.subjectApi.getByAcademy(academyId).subscribe({
            next: (subs) => {
              this.mySubjects.set(
                (subs ?? []).map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  numberOfClasses: s.numberOfClasses,
                  difficulty: s.difficulty,
                }))
              );
            },
            error: (err) =>
              this.toast(
                err?.error?.message ?? 'Failed to load subjects.',
                'error'
              ),
            complete: () => this.loading.set(false),
          });
        } else {
          // no academy: clear lists
          this.students.set([]);
          this.mySubjects.set([]);
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.toast(err?.error?.message ?? 'Failed to load trainer.', 'error');
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

    const dto = this.detailForm.getRawValue();
    this.trainerApi.updateMe(dto).subscribe({
      next: () => {
        this.toast('Trainer details saved.');
        this.saving.set(false);
      },
      error: (err) => {
        this.toast(err?.error?.message ?? 'Failed to save details.', 'error');
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

    const { studentId, grade, description } = this.gradeForm.getRawValue();
    if (!studentId || !grade) {
      this.grading.set(false);
      return;
    }

    this.gradeApi
      .createGrade(studentId, { grade, description: description ?? '' })
      .subscribe({
        next: () => {
          this.toast('Feedback submitted.');
          this.gradeForm.reset();
          this.grading.set(false);
        },
        error: (err) => {
          this.toast(
            err?.error?.message ?? 'Failed to submit feedback.',
            'error'
          );
          this.grading.set(false);
        },
      });
  }

  private toast(
    message: string,
    type: 'success' | 'error' = 'success',
    duration = 3000
  ) {
    this.snack.open(message, 'OK', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: type === 'success' ? ['snack-success'] : ['snack-error'],
    });
  }

  private decode<T = any>(token: string): T | null {
    try {
      return JSON.parse(atob(token.split('.')[1])) as T;
    } catch {
      return null;
    }
  }
}
