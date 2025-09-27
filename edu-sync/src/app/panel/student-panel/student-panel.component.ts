import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
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

  loading = signal(true);
  saving = signal(false);
  reviewing = signal(false);
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

  // Added name to the form
  detailForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    telephone: ['', [Validators.required, Validators.maxLength(30)]],
    dateOfBirth: [null as Date | null, [Validators.required]],
  });

  reviewForm = this.fb.group({
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
    this.loadAll();
  }

  private loadAll() {
    this.loading.set(true);

    this.studentApi.getMe().subscribe({
      next: (student) => {
        // keep db id if you use it elsewhere
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
          this.loading.set(false);
          return;
        }

        this.academyApi
          .getAcademy(academyId)
          .subscribe({ next: (a) => (this.academy = a) });
        this.subjectApi
          .getByAcademy(academyId)
          .subscribe({ next: (subs) => (this.subjects = subs ?? []) });
        this.trainerApi.getByAcademy(academyId).subscribe({
          next: (trs) => (this.trainers = trs ?? []),
          complete: () => this.loading.set(false),
        });
      },
      error: (err) => {
        this.errorMsg.set(
          err?.error?.message ?? 'Failed to load student data.'
        );
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
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const { name, address, telephone, dateOfBirth } =
      this.detailForm.getRawValue();

    const payload = {
      name, // <-- send name
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
        this.errorMsg.set(err?.error?.message ?? 'Failed to save details.');
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

    const { trainerId, grade, description } = this.reviewForm.getRawValue();
    if (!trainerId || !grade) {
      this.reviewing.set(false);
      return;
    }

    this.reviewApi
      .createReview(trainerId, { grade, description: description ?? '' })
      .subscribe({
        next: () => {
          this.successMsg.set('Review submitted.');
          this.reviewForm.reset();
          this.reviewing.set(false);
        },
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Failed to submit review.');
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
}
