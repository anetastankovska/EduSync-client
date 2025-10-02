import { Component, Inject, inject, signal } from '@angular/core';
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
import { SubjectApi } from '../../../services/subject.service';
import { num } from '../../../util/util';

type CreateSubjectData = {
  academies: any[];
  trainers: any[];
};

@Component({
  standalone: true,
  selector: 'app-create-subject-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './create-subject-dialog.component.html',
  styleUrls: ['./create-subject-dialog.component.scss'],
})
export class CreateSubjectDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(SubjectApi);
  private dialogRef = inject(MatDialogRef<CreateSubjectDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: CreateSubjectData) {}

  saving = signal(false);
  difficultyOptions = ['easy', 'medium', 'hard'];

  form = this.fb.group({
    name: ['', Validators.required],
    numberOfClasses: [1, [Validators.required, Validators.min(0)]],
    difficulty: ['', Validators.required],
    academyId: [null as number | null, Validators.required],
    trainerId: [null as number | null, Validators.required],
  });

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      name: v.name ?? '',
      numberOfClasses: num(v.numberOfClasses),
      difficulty: (v.difficulty ?? '') as string,
      academyId: num(v.academyId),
      trainerId: num(v.trainerId),
    };

    this.api.create(payload).subscribe({
      next: (created) => this.dialogRef.close(created),
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }
}
