import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { environment } from '../../../../environments/environment';

const ROTATION_ROW = -1;
const BENCH_ROW_OFFSET = -2;
const CELL_SIZE = 90;
const DEFAULT_FIELD_SIZE = 5;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

interface WorkingSlot {
  tempId: number;
  rowIndex: number;
  colIndex: number;
}

interface WorkingPosition {
  tempId: number;
  name: string;
  slots: WorkingSlot[];
}

interface WorkingScoringRule {
  tempId: number;
  name: string;
  variesByPosition: boolean;
  points: number;
  positionPoints: Record<string, number>;
}

interface CellRef {
  row: number;
  col: number;
  position: WorkingPosition;
  slot: WorkingSlot;
  slotNumber: number;
}

@Component({
  selector: 'app-field-builder',
  standalone: true,
  imports: [
    FormsModule,
    DragDropModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatToolbarModule
  ],
  templateUrl: './field-builder.component.html',
  styleUrl: './field-builder.component.scss'
})
export class FieldBuilderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly snackBar = inject(MatSnackBar);

  private fantasyGameId!: number;
  private fantasyGame: FantasyGameResponse | null = null;
  private nextTempId = 1;

  readonly fieldRows = signal(DEFAULT_FIELD_SIZE);
  readonly fieldCols = signal(DEFAULT_FIELD_SIZE);
  readonly gridRows = computed(() => Array.from({ length: this.fieldRows() }, (_, i) => i));
  readonly gridCols = computed(() => Array.from({ length: this.fieldCols() }, (_, i) => i));
  readonly rotationCount = computed(() => this.fieldRows() * this.fieldCols());
  readonly rotationSlots = computed(() => Array.from({ length: this.rotationCount() }, (_, i) => i));
  readonly cellSize = CELL_SIZE;

  fieldRowsInput = DEFAULT_FIELD_SIZE;
  fieldColsInput = DEFAULT_FIELD_SIZE;

  readonly benchRows = signal<number | null>(null);
  readonly benchCols = signal<number | null>(null);
  readonly hasBench = computed(() => this.benchRows() !== null && this.benchCols() !== null);
  readonly benchGridRows = computed(() => Array.from({ length: this.benchRows() ?? 0 }, (_, i) => i));
  readonly benchGridCols = computed(() => Array.from({ length: this.benchCols() ?? 0 }, (_, i) => i));

  benchRowsInput = 1;
  benchColsInput = DEFAULT_FIELD_SIZE;

  readonly hasPickField = signal(false);
  readonly pickFieldRows = signal(DEFAULT_FIELD_SIZE);
  readonly pickFieldCols = signal(DEFAULT_FIELD_SIZE);
  readonly pickGridRows = computed(() => Array.from({ length: this.pickFieldRows() }, (_, i) => i));
  readonly pickGridCols = computed(() => Array.from({ length: this.pickFieldCols() }, (_, i) => i));
  readonly pickRotationCount = computed(() => this.pickFieldRows() * this.pickFieldCols());
  readonly pickRotationSlots = computed(() => Array.from({ length: this.pickRotationCount() }, (_, i) => i));

  pickFieldRowsInput = DEFAULT_FIELD_SIZE;
  pickFieldColsInput = DEFAULT_FIELD_SIZE;

  readonly pickBenchRows = signal<number | null>(null);
  readonly pickBenchCols = signal<number | null>(null);
  readonly hasPickBench = computed(() => this.pickBenchRows() !== null && this.pickBenchCols() !== null);
  readonly pickBenchGridRows = computed(() => Array.from({ length: this.pickBenchRows() ?? 0 }, (_, i) => i));
  readonly pickBenchGridCols = computed(() => Array.from({ length: this.pickBenchCols() ?? 0 }, (_, i) => i));

  pickBenchRowsInput = 1;
  pickBenchColsInput = DEFAULT_FIELD_SIZE;

  readonly pickPositions = signal<WorkingPosition[]>([]);
  pickNewPositionName = '';
  pickNewPositionCount = 1;

  readonly fantasyGameName = signal('');
  readonly backgroundImageUrl = signal<string | null>(null);
  readonly backgroundImageDisplayUrl = computed(() => {
    const url = this.backgroundImageUrl();
    return url ? `${environment.apiUrl}${url}` : null;
  });
  readonly thumbnailUrl = signal<string | null>(null);
  readonly thumbnailDisplayUrl = computed(() => {
    const url = this.thumbnailUrl();
    return url ? `${environment.apiUrl}${url}` : null;
  });
  readonly uploadingBackground = signal(false);
  readonly uploadingThumbnail = signal(false);
  readonly positions = signal<WorkingPosition[]>([]);
  readonly scoringRules = signal<WorkingScoringRule[]>([]);

  newPositionName = '';
  newPositionCount = 1;

  showScoringRuleForm = false;
  editingRuleTempId: number | null = null;
  ruleFormName = '';
  ruleFormVariesByPosition = false;
  ruleFormPoints = 0;
  ruleFormPositionPoints: Record<string, number> = {};

  ngOnInit(): void {
    this.fantasyGameId = Number(this.route.snapshot.paramMap.get('id'));
    this.fantasyGameService.getById(this.fantasyGameId).subscribe((fantasyGame) => {
      this.fantasyGame = fantasyGame;
      this.fantasyGameName.set(fantasyGame.name);
      this.fieldRows.set(fantasyGame.fieldRows);
      this.fieldCols.set(fantasyGame.fieldCols);
      this.fieldRowsInput = fantasyGame.fieldRows;
      this.fieldColsInput = fantasyGame.fieldCols;
      this.benchRows.set(fantasyGame.benchRows);
      this.benchCols.set(fantasyGame.benchCols);
      this.benchRowsInput = fantasyGame.benchRows ?? 1;
      this.benchColsInput = fantasyGame.benchCols ?? fantasyGame.fieldCols;
      this.backgroundImageUrl.set(fantasyGame.backgroundImageUrl);
      this.thumbnailUrl.set(fantasyGame.thumbnailUrl);
      this.positions.set(
        fantasyGame.positions.map((p) => ({
          tempId: this.nextTempId++,
          name: p.name,
          slots: p.slots.map((s) => ({ tempId: this.nextTempId++, rowIndex: s.rowIndex, colIndex: s.colIndex }))
        }))
      );

      this.hasPickField.set(fantasyGame.pickFieldRows != null && fantasyGame.pickFieldCols != null);
      if (this.hasPickField()) {
        this.pickFieldRows.set(fantasyGame.pickFieldRows!);
        this.pickFieldCols.set(fantasyGame.pickFieldCols!);
        this.pickFieldRowsInput = fantasyGame.pickFieldRows!;
        this.pickFieldColsInput = fantasyGame.pickFieldCols!;
      }
      this.pickBenchRows.set(fantasyGame.pickBenchRows);
      this.pickBenchCols.set(fantasyGame.pickBenchCols);
      this.pickBenchRowsInput = fantasyGame.pickBenchRows ?? 1;
      this.pickBenchColsInput = fantasyGame.pickBenchCols ?? (fantasyGame.pickFieldCols ?? DEFAULT_FIELD_SIZE);
      this.pickPositions.set(
        fantasyGame.pickPositions.map((p) => ({
          tempId: this.nextTempId++,
          name: p.name,
          slots: p.slots.map((s) => ({ tempId: this.nextTempId++, rowIndex: s.rowIndex, colIndex: s.colIndex }))
        }))
      );
      this.scoringRules.set(
        fantasyGame.scoringRules.map((r) => ({
          tempId: this.nextTempId++,
          name: r.name,
          variesByPosition: r.variesByPosition,
          points: r.points ?? 0,
          positionPoints: Object.fromEntries((r.positionValues ?? []).map((v) => [v.positionName, v.points]))
        }))
      );
    });
  }

  applyFieldSize(): void {
    if (this.fieldRowsInput < 1 || this.fieldColsInput < 1) {
      return;
    }
    this.fieldRows.set(this.fieldRowsInput);
    this.fieldCols.set(this.fieldColsInput);

    if (this.hasPickField() && (this.pickFieldRows() > this.fieldRowsInput || this.pickFieldCols() > this.fieldColsInput)) {
      this.pickFieldRowsInput = Math.min(this.pickFieldRows(), this.fieldRowsInput);
      this.pickFieldColsInput = Math.min(this.pickFieldCols(), this.fieldColsInput);
      this.pickFieldRows.set(this.pickFieldRowsInput);
      this.pickFieldCols.set(this.pickFieldColsInput);
      this.snackBar.open('Pick Team Field was resized to fit within the main field.', 'Close', { duration: 3500 });
    }
  }

  createBench(): void {
    this.benchRowsInput = 1;
    this.benchColsInput = this.fieldCols();
    this.benchRows.set(this.benchRowsInput);
    this.benchCols.set(this.benchColsInput);
  }

  applyBenchSize(): void {
    if (this.benchRowsInput < 1 || this.benchColsInput < 1) {
      return;
    }
    this.benchRows.set(this.benchRowsInput);
    this.benchCols.set(this.benchColsInput);
  }

  removeBench(): void {
    this.benchRows.set(null);
    this.benchCols.set(null);
  }

  benchRowIndex(benchRow: number): number {
    return BENCH_ROW_OFFSET - benchRow;
  }

  createPickField(): void {
    this.hasPickField.set(true);
    this.pickFieldRowsInput = this.fieldRows();
    this.pickFieldColsInput = this.fieldCols();
    this.pickFieldRows.set(this.pickFieldRowsInput);
    this.pickFieldCols.set(this.pickFieldColsInput);

    const capacity = this.pickFieldRows() * this.pickFieldCols();
    let nextCol = 0;
    let skipped = false;
    const copiedPositions: WorkingPosition[] = [];
    for (const position of this.positions()) {
      const slots: WorkingSlot[] = [];
      for (let i = 0; i < position.slots.length; i++) {
        if (nextCol >= capacity) {
          skipped = true;
          break;
        }
        slots.push({ tempId: this.nextTempId++, rowIndex: ROTATION_ROW, colIndex: nextCol++ });
      }
      if (slots.length > 0) {
        copiedPositions.push({ tempId: this.nextTempId++, name: position.name, slots });
      }
    }
    this.pickPositions.set(copiedPositions);

    if (skipped) {
      this.snackBar.open('Not all positions fit in the Pick Team Field — increase its size.', 'Close', { duration: 4000 });
    }
  }

  removePickField(): void {
    this.hasPickField.set(false);
    this.pickFieldRows.set(DEFAULT_FIELD_SIZE);
    this.pickFieldCols.set(DEFAULT_FIELD_SIZE);
    this.pickPositions.set([]);
    this.pickBenchRows.set(null);
    this.pickBenchCols.set(null);
  }

  applyPickFieldSize(): void {
    if (this.pickFieldRowsInput < 1 || this.pickFieldColsInput < 1) {
      return;
    }
    if (this.pickFieldRowsInput > this.fieldRows() || this.pickFieldColsInput > this.fieldCols()) {
      this.snackBar.open('Pick Team Field cannot be larger than the main field.', 'Close', { duration: 3500 });
      return;
    }
    this.pickFieldRows.set(this.pickFieldRowsInput);
    this.pickFieldCols.set(this.pickFieldColsInput);
  }

  createPickBench(): void {
    this.pickBenchRowsInput = 1;
    this.pickBenchColsInput = this.pickFieldCols();
    this.pickBenchRows.set(this.pickBenchRowsInput);
    this.pickBenchCols.set(this.pickBenchColsInput);
  }

  applyPickBenchSize(): void {
    if (this.pickBenchRowsInput < 1 || this.pickBenchColsInput < 1) {
      return;
    }
    this.pickBenchRows.set(this.pickBenchRowsInput);
    this.pickBenchCols.set(this.pickBenchColsInput);
  }

  removePickBench(): void {
    this.pickBenchRows.set(null);
    this.pickBenchCols.set(null);
  }

  pickBenchRowIndex(benchRow: number): number {
    return BENCH_ROW_OFFSET - benchRow;
  }

  pickCellId(row: number, col: number): string {
    return `pick-cell-${row}-${col}`;
  }

  pickCellAt(row: number, col: number): CellRef | null {
    for (const position of this.pickPositions()) {
      const index = position.slots.findIndex((s) => s.rowIndex === row && s.colIndex === col);
      if (index !== -1) {
        return { row, col, position, slot: position.slots[index], slotNumber: index + 1 };
      }
    }
    return null;
  }

  addPickPosition(): void {
    const name = this.pickNewPositionName.trim();
    if (!name || this.pickNewPositionCount < 1) {
      return;
    }

    const freeSlots = this.findFreePickRotationSlots(this.pickNewPositionCount);
    if (freeSlots.length < this.pickNewPositionCount) {
      this.snackBar.open('Not enough free rotation slots. Move players onto the field first.', 'Close', { duration: 3500 });
      return;
    }

    const newSlots: WorkingSlot[] = freeSlots.map((col) => ({
      tempId: this.nextTempId++,
      rowIndex: ROTATION_ROW,
      colIndex: col
    }));

    const existing = this.pickPositions().find((p) => p.name === name);
    if (existing) {
      this.pickPositions.update((positions) =>
        positions.map((p) => (p.tempId === existing.tempId ? { ...p, slots: [...p.slots, ...newSlots] } : p))
      );
    } else {
      this.pickPositions.update((positions) => [...positions, { tempId: this.nextTempId++, name, slots: newSlots }]);
    }

    this.pickNewPositionName = '';
    this.pickNewPositionCount = 1;
  }

  removePickSlot(positionTempId: number, slotTempId: number): void {
    this.pickPositions.update((positions) =>
      positions
        .map((p) => (p.tempId === positionTempId ? { ...p, slots: p.slots.filter((s) => s.tempId !== slotTempId) } : p))
        .filter((p) => p.slots.length > 0)
    );
  }

  isPickCellOccupied(row: number, col: number): boolean {
    return this.pickCellAt(row, col) !== null;
  }

  canEnterPickCell = (row: number, col: number) => (): boolean => !this.isPickCellOccupied(row, col);

  onPickCellDrop(event: CdkDragDrop<CellRef | null>, row: number, col: number): void {
    const dragged = event.item.data as CellRef;
    if (!dragged || this.isPickCellOccupied(row, col)) {
      return;
    }

    this.pickPositions.update((positions) =>
      positions.map((p) =>
        p.tempId === dragged.position.tempId
          ? { ...p, slots: p.slots.map((s) => (s.tempId === dragged.slot.tempId ? { ...s, rowIndex: row, colIndex: col } : s)) }
          : p
      )
    );
  }

  private findFreePickRotationSlots(count: number): number[] {
    const found: number[] = [];
    for (let col = 0; col < this.pickRotationCount() && found.length < count; col++) {
      if (!this.isPickCellOccupied(ROTATION_ROW, col)) {
        found.push(col);
      }
    }
    return found;
  }

  onBackgroundImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!this.validateImageFile(file)) {
      input.value = '';
      return;
    }

    this.uploadingBackground.set(true);
    this.fantasyGameService.uploadBackgroundImage(this.fantasyGameId, file).subscribe({
      next: (fantasyGame) => {
        this.backgroundImageUrl.set(fantasyGame.backgroundImageUrl);
        this.uploadingBackground.set(false);
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to upload background image.', 'Close', { duration: 3000 });
        this.uploadingBackground.set(false);
        input.value = '';
      }
    });
  }

  removeBackgroundImage(): void {
    this.backgroundImageUrl.set(null);
  }

  onThumbnailImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!this.validateImageFile(file)) {
      input.value = '';
      return;
    }

    this.uploadingThumbnail.set(true);
    this.fantasyGameService.uploadThumbnailImage(this.fantasyGameId, file).subscribe({
      next: (fantasyGame) => {
        this.thumbnailUrl.set(fantasyGame.thumbnailUrl);
        this.uploadingThumbnail.set(false);
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to upload thumbnail image.', 'Close', { duration: 3000 });
        this.uploadingThumbnail.set(false);
        input.value = '';
      }
    });
  }

  private validateImageFile(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select an image file.', 'Close', { duration: 3500 });
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.snackBar.open('Image is too large. Maximum size is 10MB.', 'Close', { duration: 3500 });
      return false;
    }
    return true;
  }

  removeThumbnailImage(): void {
    this.thumbnailUrl.set(null);
  }

  cellId(row: number, col: number): string {
    return `cell-${row}-${col}`;
  }

  cellAt(row: number, col: number): CellRef | null {
    for (const position of this.positions()) {
      const index = position.slots.findIndex((s) => s.rowIndex === row && s.colIndex === col);
      if (index !== -1) {
        return { row, col, position, slot: position.slots[index], slotNumber: index + 1 };
      }
    }
    return null;
  }

  addPosition(): void {
    const name = this.newPositionName.trim();
    if (!name || this.newPositionCount < 1) {
      return;
    }

    const freeSlots = this.findFreeRotationSlots(this.newPositionCount);
    if (freeSlots.length < this.newPositionCount) {
      this.snackBar.open('Not enough free rotation slots. Move players onto the field first.', 'Close', { duration: 3500 });
      return;
    }

    const newSlots: WorkingSlot[] = freeSlots.map((col) => ({
      tempId: this.nextTempId++,
      rowIndex: ROTATION_ROW,
      colIndex: col
    }));

    const existing = this.positions().find((p) => p.name === name);
    if (existing) {
      this.positions.update((positions) =>
        positions.map((p) => (p.tempId === existing.tempId ? { ...p, slots: [...p.slots, ...newSlots] } : p))
      );
    } else {
      this.positions.update((positions) => [...positions, { tempId: this.nextTempId++, name, slots: newSlots }]);
    }

    this.newPositionName = '';
    this.newPositionCount = 1;
  }

  removeSlot(positionTempId: number, slotTempId: number): void {
    this.positions.update((positions) =>
      positions
        .map((p) => (p.tempId === positionTempId ? { ...p, slots: p.slots.filter((s) => s.tempId !== slotTempId) } : p))
        .filter((p) => p.slots.length > 0)
    );
  }

  isCellOccupied(row: number, col: number): boolean {
    return this.cellAt(row, col) !== null;
  }

  canEnterCell = (row: number, col: number) => (): boolean => !this.isCellOccupied(row, col);

  onCellDrop(event: CdkDragDrop<CellRef | null>, row: number, col: number): void {
    const dragged = event.item.data as CellRef;
    if (!dragged || this.isCellOccupied(row, col)) {
      return;
    }

    this.positions.update((positions) =>
      positions.map((p) =>
        p.tempId === dragged.position.tempId
          ? { ...p, slots: p.slots.map((s) => (s.tempId === dragged.slot.tempId ? { ...s, rowIndex: row, colIndex: col } : s)) }
          : p
      )
    );
  }

  private findFreeRotationSlots(count: number): number[] {
    const found: number[] = [];
    for (let col = 0; col < this.rotationCount() && found.length < count; col++) {
      if (!this.isCellOccupied(ROTATION_ROW, col)) {
        found.push(col);
      }
    }
    return found;
  }

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
    this.ruleFormPositionPoints = { ...this.buildDefaultPositionPoints(), ...rule.positionPoints };
  }

  confirmScoringRule(): void {
    if (!this.ruleFormName.trim()) {
      return;
    }

    const ruleData = {
      name: this.ruleFormName.trim(),
      variesByPosition: this.ruleFormVariesByPosition,
      points: this.ruleFormPoints,
      positionPoints: { ...this.ruleFormPositionPoints }
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

  objectEntries(record: Record<string, number>): [string, number][] {
    return Object.entries(record);
  }

  private buildDefaultPositionPoints(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const position of this.positions()) {
      map[position.name] = 0;
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
    if (!this.fantasyGame) {
      return;
    }

    const request = {
      name: this.fantasyGame.name,
      description: this.fantasyGame.description ?? undefined,
      fieldRows: this.fieldRows(),
      fieldCols: this.fieldCols(),
      benchRows: this.benchRows() ?? undefined,
      benchCols: this.benchCols() ?? undefined,
      pickFieldRows: this.hasPickField() ? this.pickFieldRows() : undefined,
      pickFieldCols: this.hasPickField() ? this.pickFieldCols() : undefined,
      pickBenchRows: this.pickBenchRows() ?? undefined,
      pickBenchCols: this.pickBenchCols() ?? undefined,
      budget: this.fantasyGame.budget ?? undefined,
      backgroundImageUrl: this.backgroundImageUrl() ?? undefined,
      thumbnailUrl: this.thumbnailUrl() ?? undefined,
      positions: this.positions().map((p) => ({
        name: p.name,
        slots: p.slots.map((s) => ({ rowIndex: s.rowIndex, colIndex: s.colIndex }))
      })),
      pickPositions: this.hasPickField()
        ? this.pickPositions().map((p) => ({
            name: p.name,
            slots: p.slots.map((s) => ({ rowIndex: s.rowIndex, colIndex: s.colIndex }))
          }))
        : [],
      scoringRules: this.scoringRules().map((r) => ({
        name: r.name,
        variesByPosition: r.variesByPosition,
        points: r.variesByPosition ? undefined : r.points,
        positionValues: r.variesByPosition
          ? Object.entries(r.positionPoints).map(([positionName, points]) => ({ positionName, points }))
          : []
      }))
    };

    this.fantasyGameService.update(this.fantasyGameId, request).subscribe({
      next: () => {
        this.snackBar.open('Field saved.', 'Close', { duration: 3000 });
        this.router.navigate(['/fantasy-games', this.fantasyGameId]);
      },
      error: () => this.snackBar.open('Failed to save field.', 'Close', { duration: 3000 })
    });
  }

  cancel(): void {
    this.router.navigate(['/fantasy-games', this.fantasyGameId]);
  }
}
