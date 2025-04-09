import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/**
 * Data interface for the confirm dialog
 */
export interface ConfirmDialogData {
  /** Dialog title */
  title: string;

  /** Main message */
  message: string;

  /** Optional detailed message */
  detail?: string;

  /** Text for the confirm button */
  confirmText: string;

  /** Text for the cancel button */
  cancelText: string;

  /** Whether the confirm button should be highlighted as dangerous */
  isDangerous?: boolean;
}

/**
 * Generic confirmation dialog component
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) { }

  /**
   * Closes the dialog with a negative result
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Closes the dialog with a positive result
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
