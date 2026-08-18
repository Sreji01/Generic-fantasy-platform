import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FantasyGameRequest, FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { ScoringRulePositionValue } from '../../../core/models/fantasy-game-scoring-rule.model';
import { environment } from '../../../../environments/environment';

interface WorkingScoringRule {
  tempId: number;
  name: string;
  variesByPosition: boolean;
  points: number;
  positionValues: ScoringRulePositionValue[];
}

export interface FantasyGameFormResult {
  request: FantasyGameRequest;
  thumbnailFile: File | null;
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export const CURRENCY_OPTIONS = [
  { value: '$', label: 'US Dollar ($)' },
  { value: '€', label: 'Euro (€)' },
  { value: '£', label: 'British Pound (£)' },
  { value: 'RSD', label: 'Serbian Dinar (RSD)' },
  { value: 'Coins', label: 'Coins' },
  { value: 'Credits', label: 'Credits' },
  { value: 'Points', label: 'Points' }
];

@Component({
  selector: 'app-fantasy-game-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './fantasy-game-form-dialog.component.html',
  styleUrl: './fantasy-game-form-dialog.component.scss'
})
export class FantasyGameFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<FantasyGameFormDialogComponent, FantasyGameFormResult>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<FantasyGameResponse | null>(MAT_DIALOG_DATA);

  private nextTempId = 1;

  readonly isEditMode = this.data !== null;
  readonly availablePositions = (this.data?.positions ?? []).map((p) => p.name);
  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required]],
    description: [this.data?.description ?? ''],
    startDate: [this.data?.startDate ? new Date(this.data.startDate) : null],
    endDate: [this.data?.endDate ? new Date(this.data.endDate) : null],
    budget: [this.data?.budget ?? null],
    currency: [this.data?.currency ?? null]
  });

  readonly thumbnailUrl = signal<string | null>(this.data?.thumbnailUrl ?? null);
  readonly thumbnailFile = signal<File | null>(null);
  readonly thumbnailPreviewUrl = computed(() => {
    const file = this.thumbnailFile();
    if (file) {
      return URL.createObjectURL(file);
    }
    const url = this.thumbnailUrl();
    return url ? `${environment.apiUrl}${url}` : null;
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

  onThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select an image file.', 'Close', { duration: 3500 });
      input.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.snackBar.open('Image is too large. Maximum size is 10MB.', 'Close', { duration: 3500 });
      input.value = '';
      return;
    }
    this.thumbnailFile.set(file);
    input.value = '';
  }

  removeThumbnail(): void {
    this.thumbnailFile.set(null);
    this.thumbnailUrl.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.showScoringRuleForm && this.ruleFormName.trim()) {
      this.confirmScoringRule();
    }

    const raw = this.form.getRawValue();
    const request: FantasyGameRequest = {
      name: raw.name ?? '',
      description: raw.description || undefined,
      startDate: this.toIsoDate(raw.startDate),
      endDate: this.toIsoDate(raw.endDate),
      fieldRows: this.data?.fieldRows ?? 5,
      fieldCols: this.data?.fieldCols ?? 5,
      benchRows: this.data?.benchRows ?? undefined,
      benchCols: this.data?.benchCols ?? undefined,
      pickFieldRows: this.data?.pickFieldRows ?? undefined,
      pickFieldCols: this.data?.pickFieldCols ?? undefined,
      pickBenchRows: this.data?.pickBenchRows ?? undefined,
      pickBenchCols: this.data?.pickBenchCols ?? undefined,
      budget: raw.budget ?? undefined,
      currency: raw.currency ?? undefined,
      backgroundImageUrl: this.data?.backgroundImageUrl ?? undefined,
      benchBackgroundImageUrl: this.data?.benchBackgroundImageUrl ?? undefined,
      thumbnailUrl: this.thumbnailUrl() ?? undefined,
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

    this.dialogRef.close({ request, thumbnailFile: this.thumbnailFile() });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private toIsoDate(value: Date | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
