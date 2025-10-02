import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { AcademyApi } from '../../services/academy.service';
import { StudentApi } from '../../services/student.service';
import { SubjectApi } from '../../services/subject.service';
import { TrainerApi } from '../../services/trainer.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CreateSubjectDialogComponent } from './create-subject-dialog/create-subject-dialog.component';
import { CreateAcademyDialogComponent } from './create-academy-dialog/create-academy-dialog.component';
import { ManageStudentDialogComponent } from './manage-student-dialog/manage-student-dialog.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    // Material
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCardModule,
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
  private academyApi = inject(AcademyApi);
  private subjectApi = inject(SubjectApi);
  private trainerApi = inject(TrainerApi);
  private studentApi = inject(StudentApi);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(true);

  academies: any[] = [];
  subjects: any[] = [];
  trainers: any[] = [];
  students: any[] = [];

  ngOnInit(): void {
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
      },
      error: (err) => {
        this.toast(err?.error?.message ?? 'Failed to load data.', 'error');
      },
      complete: () => this.loading.set(false),
    });
  }

  // ---------- Delete entities ----------
  deleteAcademy(id: number): void {
    if (!confirm('Delete academy?')) return;

    this.academyApi.delete(id).subscribe({
      next: () => {
        this.toast('Academy deleted.');
        this.refreshAll(); // pulls new academies/subjects/trainers/students
      },
      error: (err) =>
        this.toast(err?.error?.message ?? 'Failed to delete academy.', 'error'),
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

  private academyNameMap(): Record<number, string> {
    return Object.fromEntries(this.academies.map((a) => [a.id, a.name]));
  }

  // ---------- Dialogs ----------
  openCreateAcademy(): void {
    const ref = this.dialog.open(CreateAcademyDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { trainers: this.trainers },
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const { academy, updatedTrainer } = result;

      if (academy) {
        this.toast('Academy created.');
        this.academies.unshift(academy);
      }
      if (updatedTrainer) {
        // patch the trainer list so UI picks up the new academy
        this.trainers = this.trainers.map((t) =>
          t.id === updatedTrainer.id ? { ...t, ...updatedTrainer } : t
        );
      }
    });
  }

  openCreateSubject(): void {
    const ref = this.dialog.open(CreateSubjectDialogComponent, {
      width: '700px',
      disableClose: true,
      data: {
        academies: this.academies,
        trainers: this.trainers,
      },
    });

    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.toast('Subject created.');
        this.subjects.unshift(created);
      }
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

  openManageStudent(student: any) {
    // Ensure the student object has subjectIds (numbers):
    const subjectIds = Array.isArray(student.subjects)
      ? student.subjects.map((sub: any) => sub.id)
      : student.subjectIds ?? [];

    const ref = this.dialog.open(ManageStudentDialogComponent, {
      width: '700px',
      disableClose: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          academyId: student.academyId ?? null,
          subjectIds,
        },
        academies: this.academies.map((a) => ({ id: a.id, name: a.name })),
        subjects: this.subjects.map((s) => ({
          id: s.id,
          name: s.name,
          academyId: s.academyId,
        })),
      },
    });

    ref.afterClosed().subscribe((updated) => {
      if (!updated) return;
      this.refreshAll();
    });
  }
}
