import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AcademyApi } from '../../services/academy.service';
import { AuthService } from '../../services/auth.service';
import { StudentApi } from '../../services/student.service';
import { SubjectApi } from '../../services/subject.service';
import { TrainerReviewApi } from '../../services/trainer-review.service';
import { TrainerApi } from '../../services/trainer.service';

type Role = 'student' | 'trainer' | 'admin';

@Component({
  selector: 'app-student-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
  ],
  templateUrl: './student-panel.component.html',
  styleUrls: ['./student-panel.component.scss'],
})
export class StudentPanelComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private studentApi = inject(StudentApi);
  private academyApi = inject(AcademyApi);
  private subjectApi = inject(SubjectApi);
  private trainerApi = inject(TrainerApi);
  private reviewApi = inject(TrainerReviewApi);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  reviewing = signal(false);
  trainerLoading = signal(false);

  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  studentId!: number;

  academy: any | null = null;
  subjects: Array<{
    id: number;
    name: string;
    numberOfClasses: number;
    difficulty: string;
  }> = [];

  trainers: Array<{ id: number; name: string }> = [];

  detailForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    telephone: ['', [Validators.required, Validators.maxLength(30)]],
    dateOfBirth: [null as Date | null, [Validators.required]],
  });

  reviewForm = this.fb.group({
    subjectId: [null as number | null, [Validators.required]],
    trainerId: [null as number | null, [Validators.required]],
    grade: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const token = this.auth.token;
    const payload = token
      ? this.decode<{ sub: number; role?: Role }>(token)
      : null;

    if (!payload?.sub || this.auth.role !== 'student') {
      this.errorMsg.set('Not authorized as student.');
      this.loading.set(false);
      return;
    }

    this.studentId = Number(payload.sub);

    // React to subject change: clear trainer selection & fetch eligible trainers
    this.reviewForm.get('subjectId')!.valueChanges.subscribe((subjectId) => {
      this.trainers = [];
      this.reviewForm.get('trainerId')!.reset(null, { emitEvent: false });

      if (subjectId) {
        this.loadTrainersForSubject(Number(subjectId));
      }
    });

    this.loadAll();
  }

  private loadAll() {
    this.loading.set(true);

    this.studentApi.getMe().subscribe({
      next: (student) => {
        this.studentId = student.id;

        this.detailForm.patchValue({
          name: student?.name ?? '',
          address: student?.address ?? '',
          telephone: student?.telephone ?? '',
          dateOfBirth: student?.dateOfBirth
            ? this.toDate(student.dateOfBirth)
            : null,
        });

        const academyId = student.academyId;

        if (!academyId) {
          // if no academy, clear lists and stop
          this.academy = null;
          this.subjects = [];
          this.trainers = [];
          this.loading.set(false);
          return;
        }

        // academy info
        this.academyApi.getAcademy(academyId).subscribe({
          next: (a) => (this.academy = a),
          error: () => {}, // non-blocking
        });

        // subjects for this academy (used by the subject picker)
        this.subjectApi.getByAcademy(academyId).subscribe({
          next: (subs) => (this.subjects = subs ?? []),
          error: (err) =>
            this.toast(
              err?.error?.message ?? 'Failed to load subjects.',
              'error'
            ),
          complete: () => this.loading.set(false),
        });

        // do NOT preload trainers here; they now depend on subjectId
      },
      error: (err) => {
        this.toast(
          err?.error?.message ?? 'Failed to load student data.',
          'error'
        );
        this.loading.set(false);
      },
    });
  }

  // Load trainers eligible to be reviewed for the selected subject
  private loadTrainersForSubject(subjectId: number) {
    this.trainerLoading.set(true);
    this.trainerApi.getBySubject(subjectId).subscribe({
      next: (trs) => (this.trainers = trs ?? []),
      error: (err) =>
        this.toast(
          err?.error?.message ?? 'Failed to load trainers for subject.',
          'error'
        ),
      complete: () => this.trainerLoading.set(false),
    });
  }

  saveDetails(): void {
    if (this.detailForm.invalid) {
      this.detailForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const { name, address, telephone, dateOfBirth } =
      this.detailForm.getRawValue();

    const payload = {
      name,
      address,
      telephone,
      dateOfBirth: this.toIsoDateString(dateOfBirth as Date),
    };

    this.studentApi.updateMe(payload).subscribe({
      next: () => {
        this.successMsg.set('Details saved.');
        this.saving.set(false);
      },
      error: (err) => {
        this.toast(err?.error?.message ?? 'Failed to save details.', 'error');
        this.saving.set(false);
      },
    });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    this.reviewing.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const { subjectId, trainerId, grade, description } =
      this.reviewForm.getRawValue();

    if (!subjectId || !trainerId || !grade) {
      this.reviewing.set(false);
      return;
    }

    // Include subjectId so backend can validate trainer is eligible for that subject
    this.reviewApi
      .createReview(trainerId, {
        subjectId,
        grade,
        description: description ?? '',
      } as any)
      .subscribe({
        next: () => {
          this.successMsg.set('Review submitted.');
          this.reviewForm.reset(); // clears subject/trainer/grade/description
          this.trainers = []; // clear dependent list until next subject pick
          this.reviewing.set(false);
        },
        error: (err) => {
          this.toast(
            err?.error?.message ?? 'Failed to submit review.',
            'error'
          );
          this.reviewing.set(false);
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
  private toDate(v: string | Date): Date {
    return v instanceof Date ? v : new Date(v);
  }
  private toIsoDateString(v: string | Date): string {
    const d = this.toDate(v);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
}
