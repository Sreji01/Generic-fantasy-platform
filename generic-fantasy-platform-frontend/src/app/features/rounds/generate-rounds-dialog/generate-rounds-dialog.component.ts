import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-generate-rounds-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './generate-rounds-dialog.component.html',
  styleUrl: './generate-rounds-dialog.component.scss'
})
export class GenerateRoundsDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GenerateRoundsDialogComponent, number>);

  readonly form = this.fb.group({
    count: [10, [Validators.required, Validators.min(1), Validators.max(100)]]
  });

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue().count ?? undefined);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
