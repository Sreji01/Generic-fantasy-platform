import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { DomainService } from '../../../core/services/domain.service';
import { DomainResponse } from '../../../core/models/domain.model';
import { environment } from '../../../../environments/environment';

const ROTATION_ROW = -1;
const CELL_SIZE = 60;
const DEFAULT_FIELD_SIZE = 5;

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
  points: number;
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
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule
  ],
  templateUrl: './field-builder.component.html',
  styleUrl: './field-builder.component.scss'
})
export class FieldBuilderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly domainService = inject(DomainService);
  private readonly snackBar = inject(MatSnackBar);

  private domainId!: number;
  private domain: DomainResponse | null = null;
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

  readonly domainName = signal('');
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
  readonly positions = signal<WorkingPosition[]>([]);
  readonly scoringRules = signal<WorkingScoringRule[]>([]);

  newPositionName = '';
  newPositionCount = 1;

  showScoringRuleForm = false;
  editingRuleTempId: number | null = null;
  ruleFormName = '';
  ruleFormPoints = 0;

  ngOnInit(): void {
    this.domainId = Number(this.route.snapshot.paramMap.get('id'));
    this.domainService.getById(this.domainId).subscribe((domain) => {
      this.domain = domain;
      this.domainName.set(domain.name);
      this.fieldRows.set(domain.fieldRows);
      this.fieldCols.set(domain.fieldCols);
      this.fieldRowsInput = domain.fieldRows;
      this.fieldColsInput = domain.fieldCols;
      this.backgroundImageUrl.set(domain.backgroundImageUrl);
      this.thumbnailUrl.set(domain.thumbnailUrl);
      this.positions.set(
        domain.positions.map((p) => ({
          tempId: this.nextTempId++,
          name: p.name,
          slots: p.slots.map((s) => ({ tempId: this.nextTempId++, rowIndex: s.rowIndex, colIndex: s.colIndex }))
        }))
      );
      this.scoringRules.set(
        domain.scoringRules.map((r) => ({
          tempId: this.nextTempId++,
          name: r.name,
          points: r.points
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
  }

  onBackgroundImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.domainService.uploadBackgroundImage(this.domainId, file).subscribe({
      next: (domain) => {
        this.backgroundImageUrl.set(domain.backgroundImageUrl);
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to upload background image.', 'Close', { duration: 3000 });
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

    this.domainService.uploadThumbnailImage(this.domainId, file).subscribe({
      next: (domain) => {
        this.thumbnailUrl.set(domain.thumbnailUrl);
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to upload thumbnail image.', 'Close', { duration: 3000 });
        input.value = '';
      }
    });
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

    const slots: WorkingSlot[] = freeSlots.map((col) => ({
      tempId: this.nextTempId++,
      rowIndex: ROTATION_ROW,
      colIndex: col
    }));

    this.positions.update((positions) => [...positions, { tempId: this.nextTempId++, name, slots }]);

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
    if (!this.domain) {
      return;
    }

    const request = {
      name: this.domain.name,
      description: this.domain.description ?? undefined,
      fieldRows: this.fieldRows(),
      fieldCols: this.fieldCols(),
      backgroundImageUrl: this.backgroundImageUrl() ?? undefined,
      thumbnailUrl: this.thumbnailUrl() ?? undefined,
      positions: this.positions().map((p) => ({
        name: p.name,
        slots: p.slots.map((s) => ({ rowIndex: s.rowIndex, colIndex: s.colIndex }))
      })),
      scoringRules: this.scoringRules().map((r) => ({
        name: r.name,
        points: r.points
      }))
    };

    this.domainService.update(this.domainId, request).subscribe({
      next: () => {
        this.snackBar.open('Field saved.', 'Close', { duration: 3000 });
        this.router.navigateByUrl('/domains');
      },
      error: () => this.snackBar.open('Failed to save field.', 'Close', { duration: 3000 })
    });
  }

  cancel(): void {
    this.router.navigateByUrl('/domains');
  }
}
