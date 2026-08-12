import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { FantasyGameRequest, FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { ScoringRulePositionValue } from '../../../core/models/fantasy-game-scoring-rule.model';

interface WorkingScoringRule {
  tempId: number;
  name: string;
  variesByPosition: boolean;
  points: number;
  positionValues: ScoringRulePositionValue[];
}

@Component({
  selector: 'app-fantasy-game-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './fantasy-game-form-dialog.component.html',
  styleUrl: './fantasy-game-form-dialog.component.scss'
})
export class FantasyGameFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<FantasyGameFormDialogComponent>);
  readonly data = inject<FantasyGameResponse | null>(MAT_DIALOG_DATA);

  private nextTempId = 1;

  readonly isEditMode = this.data !== null;
  readonly availablePositions = (this.data?.positions ?? []).map((p) => p.name);

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required]],
    description: [this.data?.description ?? ''],
    budget: [this.data?.budget ?? null]
  });

  readonly scoringRules = signal<WorkingScoringRule[]>(
    (this.data?.scoringRules ?? []).map((r) => ({
      tempId: this.nextTempId++,
      name: r.name,
      variesByPosition: r.variesByPosition,
      points: r.points ?? 0,
      positionValues: r.positionValues ?? []
    }))
  );

  showScoringRuleForm = false;
  editingRuleTempId: number | null = null;
  ruleFormName = '';
  ruleFormVariesByPosition = false;
  ruleFormPoints = 0;
  ruleFormPositionPoints: Record<string, number> = {};

  toggleScoringRuleForm(): void {
    this.showScoringRuleForm = !this.showScoringRuleForm;
    if (!this.showScoringRuleForm) {
      this.resetRuleForm();
    } else if (this.editingRuleTempId === null) {
      this.ruleFormPositionPoints = this.buildDefaultPositionPoints();
    }
  }

  editScoringRule(rule: WorkingScoringRule): void {
    this.showScoringRuleForm = true;
    this.editingRuleTempId = rule.tempId;
    this.ruleFormName = rule.name;
    this.ruleFormVariesByPosition = rule.variesByPosition;
    this.ruleFormPoints = rule.points;
    this.ruleFormPositionPoints = {
      ...this.buildDefaultPositionPoints(),
      ...Object.fromEntries(rule.positionValues.map((v) => [v.positionName, v.points]))
    };
  }

  confirmScoringRule(): void {
    if (!this.ruleFormName.trim()) {
      return;
    }

    const ruleData = {
      name: this.ruleFormName.trim(),
      variesByPosition: this.ruleFormVariesByPosition,
      points: this.ruleFormPoints,
      positionValues: this.ruleFormVariesByPosition
        ? Object.entries(this.ruleFormPositionPoints).map(([positionName, points]) => ({ positionName, points }))
        : []
    };

    if (this.editingRuleTempId !== null) {
      const editingId = this.editingRuleTempId;
      this.scoringRules.update((rules) => rules.map((r) => (r.tempId === editingId ? { ...r, ...ruleData } : r)));
    } else {
      this.scoringRules.update((rules) => [...rules, { tempId: this.nextTempId++, ...ruleData }]);
    }

    this.resetRuleForm();
  }

  removeScoringRule(tempId: number): void {
    this.scoringRules.update((rules) => rules.filter((r) => r.tempId !== tempId));
    if (this.editingRuleTempId === tempId) {
      this.resetRuleForm();
    }
  }

  private buildDefaultPositionPoints(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const name of this.availablePositions) {
      map[name] = 0;
    }
    return map;
  }

  private resetRuleForm(): void {
    this.editingRuleTempId = null;
    this.ruleFormName = '';
    this.ruleFormVariesByPosition = false;
    this.ruleFormPoints = 0;
    this.ruleFormPositionPoints = {};
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const result: FantasyGameRequest = {
      name: raw.name ?? '',
      description: raw.description || undefined,
      fieldRows: this.data?.fieldRows ?? 5,
      fieldCols: this.data?.fieldCols ?? 5,
      benchRows: this.data?.benchRows ?? undefined,
      benchCols: this.data?.benchCols ?? undefined,
      pickFieldRows: this.data?.pickFieldRows ?? undefined,
      pickFieldCols: this.data?.pickFieldCols ?? undefined,
      pickBenchRows: this.data?.pickBenchRows ?? undefined,
      pickBenchCols: this.data?.pickBenchCols ?? undefined,
      budget: raw.budget ?? undefined,
      backgroundImageUrl: this.data?.backgroundImageUrl ?? undefined,
      thumbnailUrl: this.data?.thumbnailUrl ?? undefined,
      positions: (this.data?.positions ?? []).map((p) => ({
        name: p.name,
        slots: p.slots.map((s) => ({ rowIndex: s.rowIndex, colIndex: s.colIndex }))
      })),
      pickPositions: (this.data?.pickPositions ?? []).map((p) => ({
        name: p.name,
        slots: p.slots.map((s) => ({ rowIndex: s.rowIndex, colIndex: s.colIndex }))
      })),
      scoringRules: this.scoringRules().map((r) => ({
        name: r.name,
        variesByPosition: r.variesByPosition,
        points: r.variesByPosition ? undefined : r.points,
        positionValues: r.positionValues
      }))
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
