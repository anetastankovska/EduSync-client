import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AcademyApi } from '../../services/academy.service';
import { StudentApi } from '../../services/student.service';
import { SubjectApi } from '../../services/subject.service';
import { TrainerApi } from '../../services/trainer.service';
import { dstr, num } from '../../util/util';

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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    MatSnackBarModule,
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
  private snack = inject(MatSnackBar);

  // UI state
  loading = signal(true);
  saving = signal(false);

  // Data
  academies: any[] = [];
  subjects: any[] = [];
  trainers: any[] = [];
  students: any[] = [];

  // For the subject form trainer dropdown (now: ALL trainers)
  trainerOptionsForSubject: any[] = [];

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
    trainerId: [null as number | null, [Validators.required]], // required
  });

  ngOnInit(): void {
    // If you still want to reset trainer selection when academy changes, keep this:
    this.createSubjectForm.get('academyId')!.valueChanges.subscribe(() => {
      // Just reset the chosen trainer; DO NOT filter options anymore.
      this.createSubjectForm
        .get('trainerId')!
        .reset(null, { emitEvent: false });
    });

    // Do NOT disable the trainer select; it no longer depends on academy
    this.refreshAll();
  }

  /** Load everything at once */
  refreshAll(): void {
    this.loading.set(true);

    forkJoin({
      academies: this.academyApi.getAll(),
      subjects: this.subjectApi.getAll(),
      trainers: this.trainerApi.getAll(),
      students: this.studentApi.getAll(),
    }).subscribe({
      next: (res) => {
        this.academies = res.academies ?? [];
        this.subjects = res.subjects ?? [];

        const rawTrainers = (res.trainers ?? []) as any[];
        this.trainers = rawTrainers.map((t) => ({
          ...t,
          subjectIds: Array.isArray(t.subjects)
            ? t.subjects.map((s: any) => s.id)
            : t.subjectIds ?? [],
        }));

        const rawStudents = (res.students ?? []) as any[];
        this.students = rawStudents.map((s) => ({
          ...s,
          subjectIds: Array.isArray(s.subjects)
            ? s.subjects.map((sub: any) => sub.id)
            : s.subjectIds ?? [],
        }));

        // SHOW ALL TRAINERS in the subject form dropdown
        this.trainerOptionsForSubject = this.trainers;
      },
      error: (err) => {
        this.toast(err?.error?.message ?? 'Failed to load data.', 'error');
      },
      complete: () => this.loading.set(false),
    });
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
      trainerId: num(v.trainerId),
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
          trainerId: null,
        });
        // keep all-trainers behavior
        this.trainerOptionsForSubject = this.trainers;

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

  // ---------- Display helpers ----------
  academyName(id?: number | null): string {
    if (!id) return '—';
    const map = this.academyNameMap();
    return map[id] ?? this.academies.find((a) => a.id === id)?.name ?? '—';
  }

  trainerSubjectNames = (t: any): string[] => {
    if (Array.isArray(t?.subjects) && t.subjects.length) {
      return t.subjects.map((s: any) => s.name);
    }
    return this.subjects.filter((s) => s.trainerId === t.id).map((s) => s.name);
  };

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

  private academyNameMap(): Record<number, string> {
    return Object.fromEntries(this.academies.map((a) => [a.id, a.name]));
  }
}
