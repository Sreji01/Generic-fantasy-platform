import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { DomainRequest, DomainResponse } from '../../../core/models/domain.model';

interface WorkingScoringRule {
  tempId: number;
  name: string;
  points: number;
}

@Component({
  selector: 'app-domain-form-dialog',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './domain-form-dialog.component.html',
  styleUrl: './domain-form-dialog.component.scss'
})
export class DomainFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DomainFormDialogComponent>);
  readonly data = inject<DomainResponse | null>(MAT_DIALOG_DATA);

  private nextTempId = 1;

  readonly isEditMode = this.data !== null;

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required]],
    description: [this.data?.description ?? '']
  });

  readonly scoringRules = signal<WorkingScoringRule[]>(
    (this.data?.scoringRules ?? []).map((r) => ({ tempId: this.nextTempId++, name: r.name, points: r.points }))
  );

  showScoringRuleForm = false;
  editingRuleTempId: number | null = null;
  ruleFormName = '';
  ruleFormPoints = 0;

  toggleScoringRuleForm(): void {
    this.showScoringRuleForm = !this.showScoringRuleForm;
    if (!this.showScoringRuleForm) {
      this.resetRuleForm();
    }
  }

  editScoringRule(rule: WorkingScoringRule): void {
    this.showScoringRuleForm = true;
    this.editingRuleTempId = rule.tempId;
    this.ruleFormName = rule.name;
    this.ruleFormPoints = rule.points;
  }

  confirmScoringRule(): void {
    if (!this.ruleFormName.trim()) {
      return;
    }

    if (this.editingRuleTempId !== null) {
      const editingId = this.editingRuleTempId;
      this.scoringRules.update((rules) =>
        rules.map((r) => (r.tempId === editingId ? { ...r, name: this.ruleFormName.trim(), points: this.ruleFormPoints } : r))
      );
    } else {
      this.scoringRules.update((rules) => [
        ...rules,
        { tempId: this.nextTempId++, name: this.ruleFormName.trim(), points: this.ruleFormPoints }
      ]);
    }

    this.resetRuleForm();
  }

  removeScoringRule(tempId: number): void {
    this.scoringRules.update((rules) => rules.filter((r) => r.tempId !== tempId));
    if (this.editingRuleTempId === tempId) {
      this.resetRuleForm();
    }
  }

  private resetRuleForm(): void {
    this.editingRuleTempId = null;
    this.ruleFormName = '';
    this.ruleFormPoints = 0;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const result: DomainRequest = {
      name: raw.name ?? '',
      description: raw.description || undefined,
      fieldRows: this.data?.fieldRows ?? 5,
      fieldCols: this.data?.fieldCols ?? 5,
      positions: (this.data?.positions ?? []).map((p) => ({
        name: p.name,
        slots: p.slots.map((s) => ({ rowIndex: s.rowIndex, colIndex: s.colIndex }))
      })),
      scoringRules: this.scoringRules().map((r) => ({
        name: r.name,
        points: r.points
      }))
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
