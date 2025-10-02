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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AcademyApi } from '../../../services/academy.service';
import { TrainerApi } from '../../../services/trainer.service';
import { dstr, num } from '../../../util/util';

type CreateAcademyData = {
  trainers: Array<{ id: number; name: string; academyId?: number | null }>;
};

@Component({
  standalone: true,
  selector: 'app-create-academy-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  templateUrl: './create-academy-dialog.component.html',
  styleUrls: ['./create-academy-dialog.component.scss'],
})
export class CreateAcademyDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: CreateAcademyData) {}

  private fb = inject(FormBuilder);
  private api = inject(AcademyApi);
  private trainerApi = inject(TrainerApi);
  private dialogRef = inject(MatDialogRef<CreateAcademyDialogComponent>);

  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    trainerId: [null as number | null, Validators.required], // 🔒 required
  });

  close() {
    if (!this.saving()) this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const payload = {
      name: v.name ?? '',
      description: v.description ?? '',
      startDate: dstr(v.startDate),
      endDate: dstr(v.endDate),
      price: num(v.price),
    };

    this.api.create(payload).subscribe({
      next: (createdAcademy) => {
        const trainerId = v.trainerId!; // required
        this.trainerApi
          .updateTrainer(trainerId, { academyId: createdAcademy.id })
          .subscribe({
            next: (updatedTrainer) =>
              this.dialogRef.close({ academy: createdAcademy, updatedTrainer }),
            // If you want to abort the whole create on trainer error, close with null and rollback on server.
            error: () => this.dialogRef.close({ academy: createdAcademy }),
            complete: () => this.saving.set(false),
          });
      },
      error: () => this.saving.set(false),
    });
  }
}
