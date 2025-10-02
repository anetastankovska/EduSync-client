import { Component, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs';

import { StudentApi } from '../../../services/student.service';

type StudentLite = {
  id: number;
  name: string;
  email: string;
  academyId?: number | null;
  subjectIds?: number[];
};

type AcademyLite = { id: number; name: string };
type SubjectLite = { id: number; name: string; academyId: number };

type ManageStudentData = {
  student: StudentLite;
  academies: AcademyLite[];
  subjects: SubjectLite[]; // all subjects; we'll filter by academy
};

@Component({
  standalone: true,
  selector: 'app-manage-student-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './manage-student-dialog.component.html',
  styleUrls: ['./manage-student-dialog.component.scss'],
})
export class ManageStudentDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ManageStudentData) {}

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ManageStudentDialogComponent>);
  private studentApi = inject(StudentApi);

  saving = signal(false);

  form = this.fb.group({
    academyId: [this.data.student.academyId ?? null, Validators.required],
    subjectIds: [this.data.student.subjectIds ?? [], Validators.required],
  });

  // Stream academyId changes and emit initial value
  private academyId$ = this.form.get('academyId')!.valueChanges.pipe(
    startWith(this.form.get('academyId')!.value),
    map((v) => (typeof v === 'string' ? Number(v) : (v as number | null)))
  );

  // Bridge to a signal so we can use computed()
  readonly selectedAcademyId = toSignal(this.academyId$);

  // Subjects filtered by currently selected academy
  readonly subjectsForSelectedAcademy = computed<SubjectLite[]>(() => {
    const id = this.selectedAcademyId();
    if (id == null) return [];
    return (this.data.subjects ?? []).filter((s) => {
      const aid =
        typeof s.academyId === 'string' ? Number(s.academyId) : s.academyId;
      return aid === id;
    });
  });

  // Keep subjectIds consistent when academy changes
  private _syncSelection = this.form
    .get('academyId')!
    .valueChanges.subscribe(() => {
      const valid = new Set(this.subjectsForSelectedAcademy().map((s) => s.id));
      const current = (this.form.get('subjectIds')!.value as number[]) ?? [];
      const filtered = current.filter((id) => valid.has(id));
      if (filtered.length !== current.length) {
        this.form.get('subjectIds')!.setValue(filtered);
        this.form.get('subjectIds')!.markAsDirty();
      }
    });

  close() {
    if (!this.saving()) this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const { academyId, subjectIds } = this.form.getRawValue();
    const payload = {
      academyId: academyId as number,
      subjectIds: (subjectIds as number[]) ?? [],
    };

    // Adjust to your API shape if different
    this.studentApi.updateStudent(this.data.student.id, payload).subscribe({
      next: (updated) => this.dialogRef.close(updated),
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }
}
