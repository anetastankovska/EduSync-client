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
import { SubjectApi } from '../../services/subject.service';

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
  private subjectApi = inject(SubjectApi);
  private gradeApi = inject(StudentGradeApi);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  grading = signal(false);

  trainerId!: number;
  academy: any | null = null;

  // Students enrolled to the selected subject
  subjectStudents = signal<
    Array<{ id: number; name: string; academyId: number }>
  >([]);

  // Subjects for trainer’s academy
  mySubjects = signal<
    Array<{
      id: number;
      name: string;
      numberOfClasses?: number;
      difficulty?: string;
    }>
  >([]);

  seniorityOptions = [...SENIORITY_OPTIONS];

  // ===== Received feedbacks state (for the trainer) =====
  trainerReviews: Array<{
    id: number;
    grade: number;
    description?: string;
    trainerId: number;
    subjectId: number;
    studentId: number;
    createdAt: string;
  }> = [];

  private subjectById = new Map<number, { id: number; name: string }>();
  private studentNameById = new Map<number, string>();

  reviewRows: Array<{
    id: number;
    grade: number;
    subjectName: string;
    studentName: string;
    description?: string;
    createdAt: Date;
  }> = [];
  // ======================================================

  detailForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    age: [18, [Validators.required, Validators.min(18)]],
    seniority: [SENIORITY_OPTIONS[0] as Seniority, [Validators.required]],
  });

  // Subject required; students depend on it
  gradeForm = this.fb.group({
    subjectId: [null as number | null, [Validators.required]],
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

    // Load students when subject changes
    this.gradeForm.get('subjectId')!.valueChanges.subscribe((subjectId) => {
      this.subjectStudents.set([]);
      this.gradeForm.get('studentId')!.reset(null, { emitEvent: false });
      if (subjectId) this.loadStudentsForSubject(Number(subjectId));
    });

    this.loadAll();
  }

  private loadAll() {
    this.loading.set(true);

    this.trainerApi.getMe().subscribe({
      next: (trainer) => {
        this.trainerId = trainer.id;
        this.detailForm.patchValue({
          name: trainer.name ?? '',
          email: trainer.email ?? '',
          age: trainer.age ?? 18,
          seniority: trainer.seniority ?? this.seniorityOptions[0],
        });

        const academyId = trainer.academyId;
        if (academyId) {
          // academy card
          this.academyApi.getAcademy(academyId).subscribe({
            next: (a) => (this.academy = a),
            error: () => {},
          });

          // Load subjects for my academy (and create subject map for review rendering)
          this.subjectApi.getByAcademy(academyId).subscribe({
            next: (subs) => {
              const list = (subs ?? []).map((s: any) => ({
                id: s.id,
                name: s.name,
                numberOfClasses: s.numberOfClasses,
                difficulty: s.difficulty,
              }));
              this.mySubjects.set(list);

              this.subjectById.clear();
              for (const s of list)
                this.subjectById.set(s.id, { id: s.id, name: s.name });

              // After subjects are known, load trainer with reviews to render feedback list
              this.loadTrainerWithReviews(this.trainerId);
            },
            error: (err) => {
              this.toast(
                err?.error?.message ?? 'Failed to load subjects.',
                'error'
              );
              // Still try to load reviews; subject names may show as "Subject #id"
              this.loadTrainerWithReviews(this.trainerId);
            },
            complete: () => this.loading.set(false),
          });
        } else {
          // no academy: clear lists
          this.mySubjects.set([]);
          this.subjectStudents.set([]);
          // Still show reviews for trainer (if any)
          this.loadTrainerWithReviews(this.trainerId);
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.toast(err?.error?.message ?? 'Failed to load trainer.', 'error');
        this.loading.set(false);
      },
    });
  }

  /** Fetch trainer (with trainerReviews), then map & build rows */
  private loadTrainerWithReviews(trainerId: number) {
    this.trainerApi.getTrainer(trainerId).subscribe({
      next: (payload) => {
        this.trainerReviews = payload?.trainerReviews ?? [];

        // If response also carries trainer.subjects, merge them into subject map (fallback)
        const respSubjects: Array<any> = payload?.subjects ?? [];
        for (const s of respSubjects) {
          if (!this.subjectById.has(s.id))
            this.subjectById.set(s.id, { id: s.id, name: s.name });
        }

        // Preload student names (best-effort)
        this.preloadStudentNames(this.trainerReviews.map((r) => r.studentId));
        this.rebuildReviewRows();
      },
      error: () => {
        this.rebuildReviewRows();
      },
    });
  }

  /** Best-effort preload of student names via StudentApi.getStudent(id) */
  private preloadStudentNames(studentIds: number[]) {
    const unique = Array.from(new Set(studentIds)).filter(
      (id) => !this.studentNameById.has(id)
    );
    if (!unique.length) return;

    for (const id of unique) {
      // placeholder immediately
      this.studentNameById.set(id, `Student #${id}`);

      const maybeGet: any = (this.studentApi as any)?.getStudent;
      if (typeof maybeGet === 'function') {
        maybeGet.call(this.studentApi, id).subscribe({
          next: (s: any) => {
            if (s?.name) this.studentNameById.set(id, s.name);
            this.rebuildReviewRows();
          },
          error: () => {
            /* keep placeholder */
          },
        });
      }
    }
  }

  /** Build rows for rendering (newest first) */
  private rebuildReviewRows() {
    this.reviewRows = (this.trainerReviews ?? [])
      .map((r) => {
        const subjectName =
          this.subjectById.get(r.subjectId)?.name ?? `Subject #${r.subjectId}`;
        const studentName =
          this.studentNameById.get(r.studentId) ?? `Student #${r.studentId}`;
        return {
          id: r.id,
          grade: r.grade,
          subjectName,
          studentName,
          description: r.description,
          createdAt: new Date(r.createdAt),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Fetch students enrolled to the selected subject
  private loadStudentsForSubject(subjectId: number) {
    // backend: GET /student?subjectId=xxx
    this.studentApi.getBySubject(subjectId).subscribe({
      next: (list) => {
        this.subjectStudents.set(
          (list ?? []).map((s: any) => ({
            id: s.id,
            name: s.name ?? '',
            academyId: s.academyId,
          }))
        );
      },
      error: (err) =>
        this.toast(
          err?.error?.message ?? 'Failed to load students for subject.',
          'error'
        ),
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

    const { studentId, subjectId, grade, description } =
      this.gradeForm.getRawValue();
    if (!studentId || !subjectId || !grade) {
      this.grading.set(false);
      return;
    }

    // Include subjectId so backend can enforce constraints
    this.gradeApi
      .createGrade(studentId, {
        subjectId,
        grade,
        description: description ?? '',
      } as any)
      .subscribe({
        next: () => {
          this.toast('Feedback submitted.');
          this.gradeForm.reset();
          this.subjectStudents.set([]);
          this.grading.set(false);

          // Optional: refresh received feedbacks after submitting
          this.loadTrainerWithReviews(this.trainerId);
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
