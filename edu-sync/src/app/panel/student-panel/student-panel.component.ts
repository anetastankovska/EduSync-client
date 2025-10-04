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

  /** ===== grades state ===== */
  studentGrades: Array<{
    id: number;
    grade: number;
    description?: string;
    studentId: number;
    trainerId: number;
    subjectId: number;
    createdAt: string;
  }> = [];

  private subjectById = new Map<number, { id: number; name: string }>();
  private trainerNameById = new Map<number, string>();

  gradeRows: Array<{
    id: number;
    grade: number;
    subjectName: string;
    trainerName: string;
    description?: string;
    createdAt: Date;
  }> = [];
  /** ======================== */

  detailForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    telephone: ['', [Validators.required, Validators.maxLength(30)]],
    dateOfBirth: [null as Date | null, [Validators.required]],
  });

  reviewForm = this.fb.group({
    subjectId: [null as number | null, [Validators.required]],
    // IMPORTANT: manage disabled via FormControl (no [disabled] in template)
    trainerId: [
      { value: null as number | null, disabled: true },
      [Validators.required],
    ],
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

    // React to subject change: load eligible trainers & enable the select
    const subjectCtrl = this.reviewForm.get('subjectId')!;
    const trainerCtrl = this.reviewForm.get('trainerId')!;

    subjectCtrl.valueChanges.subscribe((subjectId) => {
      this.trainers = [];
      trainerCtrl.reset(null, { emitEvent: false });
      if (subjectId) {
        trainerCtrl.disable({ emitEvent: false }); // keep disabled while loading
        this.loadTrainersForSubject(Number(subjectId));
      } else {
        trainerCtrl.disable({ emitEvent: false });
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
          this.academy = null;
          this.subjects = [];
          this.trainers = [];
          this.studentGrades = [];
          this.gradeRows = [];
          this.loading.set(false);
          return;
        }

        // academy (non-blocking)
        this.academyApi.getAcademy(academyId).subscribe({
          next: (a) => (this.academy = a),
          error: () => {},
        });

        // subjects (for subjectId -> name mapping)
        this.subjectApi.getByAcademy(academyId).subscribe({
          next: (subs) => {
            this.subjects = subs ?? [];
            this.subjectById.clear();
            for (const s of this.subjects)
              this.subjectById.set(s.id, { id: s.id, name: s.name });

            // after subjects known, load student with grades
            this.loadStudentWithGrades(this.studentId);
          },
          error: (err) => {
            this.toast(
              err?.error?.message ?? 'Failed to load subjects.',
              'error'
            );
            this.loading.set(false);
          },
        });
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

  /** fetch student (with grades) and build rows */
  private loadStudentWithGrades(studentId: number) {
    this.studentApi.getStudent(studentId).subscribe({
      next: (payload) => {
        this.studentGrades = payload?.studentGrades ?? [];
        this.preloadTrainerNames(this.studentGrades.map((g) => g.trainerId));
        this.rebuildGradeRows();
      },
      error: () => {
        this.rebuildGradeRows();
      },
      complete: () => this.loading.set(false),
    });
  }

  /** best-effort preload of trainer names; uses TrainerApi.getTrainer(id) if available */
  private preloadTrainerNames(trainerIds: number[]) {
    const unique = Array.from(new Set(trainerIds)).filter(
      (id) => !this.trainerNameById.has(id)
    );
    if (!unique.length) return;

    for (const id of unique) {
      // placeholder now
      this.trainerNameById.set(id, `Trainer #${id}`);

      const maybeGet: any = (this.trainerApi as any)?.getTrainer;
      if (typeof maybeGet === 'function') {
        maybeGet.call(this.trainerApi, id).subscribe({
          next: (t: any) => {
            if (t?.name) this.trainerNameById.set(id, t.name);
            this.rebuildGradeRows();
          },
          error: () => {},
        });
      }
    }
  }

  /** compose rows for display (newest first) */
  private rebuildGradeRows() {
    this.gradeRows = (this.studentGrades ?? [])
      .map((g) => {
        const subjectName =
          this.subjectById.get(g.subjectId)?.name ?? `Subject #${g.subjectId}`;
        const trainerName =
          this.trainerNameById.get(g.trainerId) ?? `Trainer #${g.trainerId}`;
        return {
          id: g.id,
          grade: g.grade,
          subjectName,
          trainerName,
          description: g.description,
          createdAt: this.toDate(g.createdAt),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Load trainers for selected subject; re-enable control when loaded
  private loadTrainersForSubject(subjectId: number) {
    this.trainerLoading.set(true);
    const trainerCtrl = this.reviewForm.get('trainerId')!;

    this.trainerApi.getBySubject(subjectId).subscribe({
      next: (trs) => {
        this.trainers = trs ?? [];
        if (this.reviewForm.get('subjectId')!.value) {
          trainerCtrl.enable({ emitEvent: false });
        } else {
          trainerCtrl.disable({ emitEvent: false });
        }
      },
      error: (err) => {
        this.toast(
          err?.error?.message ?? 'Failed to load trainers for subject.',
          'error'
        );
        trainerCtrl.disable({ emitEvent: false });
      },
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

    this.reviewApi
      .createReview(trainerId, {
        subjectId,
        grade,
        description: description ?? '',
      } as any)
      .subscribe({
        next: () => {
          this.successMsg.set('Review submitted.');
          this.reviewForm.reset();
          // keep trainer select disabled until a new subject is chosen
          this.reviewForm.get('trainerId')!.disable({ emitEvent: false });
          this.trainers = [];
          this.reviewing.set(false);
          // refresh received feedbacks
          this.loadStudentWithGrades(this.studentId);
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
