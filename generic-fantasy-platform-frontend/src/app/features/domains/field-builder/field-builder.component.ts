import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { DomainService } from '../../../core/services/domain.service';
import { DomainResponse } from '../../../core/models/domain.model';

interface WorkingPosition {
  tempId: number;
  name: string;
  playerCount: number;
  xPosition: number;
  yPosition: number;
}

interface WorkingScoringRule {
  tempId: number;
  name: string;
  points: number;
}

@Component({
  selector: 'app-field-builder',
  standalone: true,
  imports: [
    FormsModule,
    DragDropModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule
  ],
  templateUrl: './field-builder.component.html',
  styleUrl: './field-builder.component.scss'
})
export class FieldBuilderComponent implements OnInit {
  @ViewChild('fieldContainer') private readonly fieldContainerRef!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly domainService = inject(DomainService);
  private readonly snackBar = inject(MatSnackBar);

  private domainId!: number;
  private domain: DomainResponse | null = null;
  private nextTempId = 1;

  readonly domainName = signal('');
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
      this.positions.set(
        domain.positions.map((p) => ({
          tempId: this.nextTempId++,
          name: p.name,
          playerCount: p.playerCount,
          xPosition: p.xPosition,
          yPosition: p.yPosition
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

  addPosition(): void {
    if (!this.newPositionName.trim() || this.newPositionCount < 1) {
      return;
    }

    this.positions.update((positions) => [
      ...positions,
      {
        tempId: this.nextTempId++,
        name: this.newPositionName.trim(),
        playerCount: this.newPositionCount,
        xPosition: 50,
        yPosition: 50
      }
    ]);

    this.newPositionName = '';
    this.newPositionCount = 1;
  }

  removePosition(tempId: number): void {
    this.positions.update((positions) => positions.filter((p) => p.tempId !== tempId));
  }

  onDragEnded(event: CdkDragEnd<unknown>, position: WorkingPosition): void {
    const container = this.fieldContainerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const distance = event.distance;

    const currentXPx = (position.xPosition / 100) * rect.width;
    const currentYPx = (position.yPosition / 100) * rect.height;

    const newXPercent = this.clamp(((currentXPx + distance.x) / rect.width) * 100, 0, 100);
    const newYPercent = this.clamp(((currentYPx + distance.y) / rect.height) * 100, 0, 100);

    this.positions.update((positions) =>
      positions.map((p) => (p.tempId === position.tempId ? { ...p, xPosition: newXPercent, yPosition: newYPercent } : p))
    );

    event.source.reset();
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
      positions: this.positions().map((p) => ({
        name: p.name,
        playerCount: p.playerCount,
        xPosition: p.xPosition,
        yPosition: p.yPosition
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

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
