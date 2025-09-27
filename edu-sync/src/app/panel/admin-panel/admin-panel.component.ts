// src/app/panel/admin-panel.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // <-- add

// APIs & utils
import { AcademyApi } from '../../services/academy.service';
import { StudentApi } from '../../services/student.service';
import { SubjectApi } from '../../services/subject.service';
import { TrainerApi } from '../../services/trainer.service';
import { dstr, num } from '../../util/util';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatSnackBarModule, // <-- add
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
  private fb = inject(FormBuilder);
  private academyApi = inject(AcademyApi);
  private subjectApi = inject(SubjectApi);
  private trainerApi = inject(TrainerApi);
  private studentApi = inject(StudentApi);
  private snack = inject(MatSnackBar); // <-- add

  // UI state
  loading = signal(true);
  saving = signal(false);

  // Data
  academies: any[] = [];
  subjects: any[] = [];
  trainers: any[] = [];
  students: any[] = [];

  // Create Academy form
  createAcademyForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    startDate: [null as Date | null, [Validators.required]],
    endDate: [null as Date | null, [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  // Create Subject form
  difficultyOptions = ['easy', 'medium', 'hard'];
  createSubjectForm = this.fb.group({
    name: ['', [Validators.required]],
    numberOfClasses: [1, [Validators.required, Validators.min(0)]],
    difficulty: ['', [Validators.required]],
    academyId: [null as number | null, [Validators.required]],
  });

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loading.set(true);

    Promise.all([
      this.academyApi
        .getAll()
        .toPromise()
        .then((x) => (this.academies = x ?? [])),
      this.subjectApi
        .getAll()
        .toPromise()
        .then((x) => (this.subjects = x ?? [])),
      this.trainerApi
        .getAll()
        .toPromise()
        .then((x: any[] | undefined) => {
          this.trainers = (x ?? []).map((t) => ({
            ...t,
            subjectIds: Array.isArray(t.subjects)
              ? t.subjects.map((s: any) => s.id)
              : t.subjectIds ?? [],
          }));
        }),
      this.studentApi
        .getAll()
        .toPromise()
        .then((x: any[] | undefined) => {
          this.students = (x ?? []).map((s) => ({
            ...s,
            subjectIds: Array.isArray(s.subjects)
              ? s.subjects.map((sub: any) => sub.id)
              : s.subjectIds ?? [],
          }));
        }),
    ])
      .catch((err) =>
        this.toast(err?.error?.message ?? 'Failed to load data.', 'error')
      )
      .finally(() => this.loading.set(false));
  }

  // ---------- Create Academy ----------
  createAcademy(): void {
    if (this.createAcademyForm.invalid) {
      this.createAcademyForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    const v = this.createAcademyForm.getRawValue();
    const payload = {
      name: v.name ?? '',
      description: v.description ?? '',
      startDate: dstr(v.startDate),
      endDate: dstr(v.endDate),
      price: num(v.price),
    };

    this.academyApi.create(payload).subscribe({
      next: (a) => {
        this.toast('Academy created.');
        this.academies.unshift(a);
        this.createAcademyForm.reset({
          name: '',
          description: '',
          startDate: null,
          endDate: null,
          price: 0,
        });
        this.createAcademyForm.markAsPristine();
        this.createAcademyForm.markAsUntouched();
        this.createAcademyForm.updateValueAndValidity();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast(err?.error?.message ?? 'Failed to create academy.', 'error');
        this.saving.set(false);
      },
    });
  }

  deleteAcademy(id: number): void {
    if (!confirm('Delete academy?')) return;
    this.academyApi.delete(id).subscribe({
      next: () => (this.academies = this.academies.filter((a) => a.id !== id)),
      error: (err) =>
        this.toast(err?.error?.message ?? 'Failed to delete academy.', 'error'),
    });
  }

  // ---------- Create Subject ----------
  createSubject(): void {
    if (this.createSubjectForm.invalid) {
      this.createSubjectForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    const v = this.createSubjectForm.getRawValue();
    const payload = {
      name: v.name ?? '',
      numberOfClasses: num(v.numberOfClasses),
      difficulty: (v.difficulty ?? '') as string,
      academyId: num(v.academyId),
    };

    this.subjectApi.create(payload).subscribe({
      next: (s) => {
        this.toast('Subject created.');
        this.subjects.unshift(s);
        this.createSubjectForm.reset({
          name: '',
          numberOfClasses: 1,
          difficulty: '',
          academyId: null,
        });
        this.createSubjectForm.markAsPristine();
        this.createSubjectForm.markAsUntouched();
        this.createSubjectForm.updateValueAndValidity();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast(err?.error?.message ?? 'Failed to create subject.', 'error');
        this.saving.set(false);
      },
    });
  }

  deleteSubject(id: number): void {
    if (!confirm('Delete subject?')) return;
    this.subjectApi.delete(id).subscribe({
      next: () => (this.subjects = this.subjects.filter((s) => s.id !== id)),
      error: (err) =>
        this.toast(err?.error?.message ?? 'Failed to delete subject.', 'error'),
    });
  }

  // ---------- Delete people ----------
  deleteTrainer(id: number): void {
    if (!confirm('Delete trainer?')) return;
    this.trainerApi.delete(id).subscribe({
      next: () => (this.trainers = this.trainers.filter((t) => t.id !== id)),
      error: (err) =>
        this.toast(err?.error?.message ?? 'Failed to delete trainer.', 'error'),
    });
  }

  deleteStudent(id: number): void {
    if (!confirm('Delete student?')) return;
    this.studentApi.delete(id).subscribe({
      next: () => (this.students = this.students.filter((s) => s.id !== id)),
      error: (err) =>
        this.toast(err?.error?.message ?? 'Failed to delete student.', 'error'),
    });
  }

  // ---------- Assignment helpers ----------
  subjectsForAcademy(academyId?: number | null) {
    if (!academyId) return [];
    return this.subjects.filter((s) => s.academyId === academyId);
  }

  onSetTrainerAcademy(t: any, academyId: number | null) {
    this.trainerApi.updateAcademy(t.id, academyId as any).subscribe({
      next: () => {
        t.academyId = academyId;
        t.subjectIds = []; // clear when academy changes
        this.toast('Trainer academy updated.');
      },
      error: (err) =>
        this.toast(
          err?.error?.message ?? 'Failed to set trainer academy.',
          'error'
        ),
    });
  }

  onSetTrainerSubjects(t: any, subjectIds: number[]) {
    if (!t.academyId) return;
    this.trainerApi.setSubjects(t.id, subjectIds).subscribe({
      next: () => {
        t.subjectIds = subjectIds;
        this.toast('Trainer subjects updated.');
      },
      error: (err) =>
        this.toast(
          err?.error?.message ?? 'Failed to set trainer subjects.',
          'error'
        ),
    });
  }

  onSetStudentAcademy(s: any, academyId: number | null) {
    this.studentApi.updateAcademy(s.id, academyId as any).subscribe({
      next: () => {
        s.academyId = academyId;
        s.subjectIds = [];
        this.toast('Student academy updated.');
      },
      error: (err) =>
        this.toast(
          err?.error?.message ?? 'Failed to set student academy.',
          'error'
        ),
    });
  }

  onSetStudentSubjects(s: any, subjectIds: number[]) {
    if (!s.academyId) return;
    this.studentApi.setSubjects(s.id, subjectIds).subscribe({
      next: () => {
        s.subjectIds = subjectIds;
        this.toast('Student subjects updated.');
      },
      error: (err) =>
        this.toast(
          err?.error?.message ?? 'Failed to set student subjects.',
          'error'
        ),
    });
  }

  // snack helper
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
