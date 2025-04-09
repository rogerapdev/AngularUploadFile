import { Component, OnInit, Inject, ViewChild, ElementRef, Output, EventEmitter, Type, Injector, ComponentRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { UploadModalConfig, FileItem, ValidationResult, ServerValidationResult, Notification } from '../../models/upload-modal.models';
import { FileUtilsService } from '../../services/file-utils.service';

@Component({
    selector: 'app-upload-modal',
    templateUrl: './upload-modal.component.html',
    styleUrls: ['./upload-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatProgressSpinnerModule
    ]
})
export class UploadModalComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    @Output() filesChanged = new EventEmitter<FileItem[]>();

    // Files and selection
    files: FileItem[] = [];
    dataSource = new MatTableDataSource<FileItem>([]);
    selection = new SelectionModel<FileItem>(true, []);
    displayedColumns: string[] = ['select', 'name', 'type', 'size', 'actions'];

    // UI state
    isDragging = false;
    isLoading = false;
    isFullscreen = false;
    loadingMessage = '';
    notifications: Notification[] = [];
    viewMode: 'table' | 'gallery' = 'table';

    // Preview state
    previewFile: FileItem | null = null;
    previewComponentType: Type<any> | null = null;
    previewComponentInjector: Injector | undefined = undefined;
    previewComponentRef: ComponentRef<any> | null = null;

    /**
     * Current index of the file being previewed
     */
    currentPreviewIndex = 0;

    constructor(
        public dialogRef: MatDialogRef<UploadModalComponent>,
        @Inject(MAT_DIALOG_DATA) public config: UploadModalConfig,
        private sanitizer: DomSanitizer,
        public fileUtilsService: FileUtilsService,
        private injector: Injector
    ) { }

    ngOnInit(): void {
        // Initialize with default values if not provided
        this.config = {
            ...{
                title: 'Upload Files',
                acceptedFormats: '*',
                maxFileSize: 0,
                maxFiles: 0,
                allowOnlyValidFiles: true,
                fileNameFormat: '*.*',
                validateFile: null,
                validateFileOnServer: null,
                validateFilesOnServer: null,
                previewComponents: {},
                texts: {}
            },
            ...this.config
        };

        this.dataSource.data = this.files;
    }

    ngAfterViewInit(): void {
        if (this.sort && this.paginator) {
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
        }
    }

    /**
     * Handles file selection from the file input
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.processFiles(Array.from(input.files));
            input.value = ''; // Reset input to allow selecting the same file again
        }
    }

    /**
     * Handles drag over event
     */
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    /**
     * Handles drag leave event
     */
    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    /**
     * Handles drop event
     */
    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.processFiles(Array.from(event.dataTransfer.files));
        }
    }

    /**
     * Processes the selected files
     */
    async processFiles(newFiles: File[]): Promise<void> {
        // Check if max files limit is reached
        if (this.config.maxFiles && this.files.length + newFiles.length > this.config.maxFiles) {
            this.addNotification({
                type: 'error',
                message: `You can upload a maximum of ${this.config.maxFiles} files.`
            });
            return;
        }

        // Process each file
        for (const file of newFiles) {
            // Check if file already exists
            if (this.files.some(f => f.name === file.name && f.size === file.size)) {
                this.addNotification({
                    type: 'error',
                    message: `File "${file.name}" already exists.`
                });
                continue;
            }

            // Create file item
            const fileItem: FileItem = {
                id: this.generateUniqueId(),
                file: file,
                name: file.name,
                size: file.size,
                type: file.type || this.getFileExtension(file.name),
                preview: await this.createPreview(file),
                isValid: true,
                validationReason: ''
            };

            // Validate file
            const validationResult = await this.validateFile(fileItem);
            fileItem.isValid = validationResult.isValid;
            fileItem.validationReason = validationResult.reason;

            // Add file to list
            this.files.push(fileItem);
        }

        // Update data source
        this.updateDataSource();

        // Emit change event
        this.filesChanged.emit(this.files);
    }

    /**
     * Creates a preview URL for the file
     */
    private async createPreview(file: File): Promise<SafeUrl> {
        if (this.fileUtilsService.isImageFile(file)) {
            return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
        } else if (this.fileUtilsService.isPdfFile(file)) {
            return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
        } else {
            return '';
        }
    }

    /**
     * Validates a file based on size, format and custom validation
     */
    private async validateFile(fileItem: FileItem): Promise<ValidationResult> {
        // Check file size
        if (this.config.maxFileSize && this.config.maxFileSize > 0 && fileItem.size > this.config.maxFileSize) {
            return {
                isValid: false,
                reason: `File size exceeds the maximum allowed size of ${this.formatFileSize(this.config.maxFileSize)}.`
            };
        }

        // Check file format
        if (this.config.acceptedFormats && this.config.acceptedFormats !== '*') {
            if (!this.isFormatAccepted(fileItem.file)) {
                return {
                    isValid: false,
                    reason: `File format is not allowed. Accepted formats: ${this.config.acceptedFormats}.`
                };
            }
        }

        // Custom client-side validation
        if (this.config.validateFile) {
            try {
                const customValidation = await this.config.validateFile(fileItem);
                if (!customValidation.isValid) {
                    return customValidation;
                }
            } catch (error) {
                return {
                    isValid: false,
                    reason: `Validation error: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }

        // Server-side validation
        if (this.config.validateFileOnServer) {
            try {
                this.isLoading = true;
                this.loadingMessage = 'Validating file...';

                const serverValidation = await this.config.validateFileOnServer(fileItem);

                this.isLoading = false;

                if (!serverValidation.isValid) {
                    return {
                        isValid: false,
                        reason: serverValidation.reason
                    };
                }

                // Update file item with any additional data from server
                if (serverValidation.data) {
                    Object.assign(fileItem, serverValidation.data);
                }
            } catch (error) {
                this.isLoading = false;
                return {
                    isValid: false,
                    reason: `Server validation error: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }

        return { isValid: true, reason: '' };
    }

    /**
     * Checks if the file format is accepted based on the acceptedFormats configuration
     */
    private isFormatAccepted(file: File): boolean {
        if (!this.config.acceptedFormats || this.config.acceptedFormats === '*') {
            return true;
        }

        // Get file MIME type
        const fileType = file.type.toLowerCase();

        // Get file extension
        const fileName = file.name.toLowerCase();
        const fileExtension = '.' + fileName.split('.').pop();

        // Split accepted formats into a list
        const acceptedFormatsList = this.config.acceptedFormats.split(',').map(format => format.trim().toLowerCase());

        console.log('Checking file format:', {
            fileName,
            fileType,
            fileExtension,
            acceptedFormats: this.config.acceptedFormats,
            acceptedFormatsList
        });

        // Check if the file MIME type or extension is in the list of accepted formats
        for (const format of acceptedFormatsList) {
            // Check direct MIME type (e.g., image/png)
            if (fileType && fileType === format) {
                return true;
            }

            // Check MIME type with wildcard (e.g., image/*)
            if (format.endsWith('/*') && fileType && fileType.startsWith(format.replace('/*', '/'))) {
                return true;
            }

            // Check extension (e.g., .png, .jpg, .jpeg)
            if (format.startsWith('.') && fileExtension === format) {
                return true;
            }

            // Check general wildcard (e.g., image/*)
            if (format === 'image/*' && fileType && fileType.startsWith('image/')) {
                return true;
            }

            // Check common image extensions if the accepted format is image/*
            if (format === 'image/*' && ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(fileExtension)) {
                return true;
            }

            // Check for wildcard extension (e.g., *.jpg)
            if (format.startsWith('*.') && fileExtension === format.substring(1)) {
                return true;
            }

            // Check for wildcard all (*.*)
            if (format === '*.*') {
                return true;
            }
        }

        console.log('Format not accepted');
        return false;
    }


    /**
     * Updates the data source for the table
     */
    private updateDataSource(): void {
        this.dataSource.data = [...this.files];
    
        // Atualize o paginator se necessário
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
    }

    /**
     * Removes a file from the list
     */
    removeFile(file: FileItem): void {
        const index = this.files.findIndex(f => f.id === file.id);
        if (index !== -1) {
            this.files.splice(index, 1);

            // Remove from selection if selected
            if (this.selection.isSelected(file)) {
                this.selection.deselect(file);
            }

            // Update data source
            this.updateDataSource();

            // Emit change event
            this.filesChanged.emit(this.files);

            // Close preview if this file is being previewed
            if (this.previewFile && this.previewFile.id === file.id) {
                this.closePreview();
            }
        }
    }

    /**
     * Removes selected files
     */
    removeSelectedFiles(): void {
        const selectedFiles = this.selection.selected;

        // Remove each selected file
        selectedFiles.forEach(file => {
            const index = this.files.findIndex(f => f.id === file.id);
            if (index !== -1) {
                this.files.splice(index, 1);
            }
        });

        // Clear selection
        this.selection.clear();

        // Update data source
        this.updateDataSource();

        // Emit change event
        this.filesChanged.emit(this.files);

        // Close preview if the file is being previewed
        if (this.previewFile && selectedFiles.some(f => f.id === this.previewFile?.id)) {
            this.closePreview();
        }
    }

    /**
     * Toggles between table and gallery view
     */
    toggleViewMode(): void {
        this.viewMode = this.viewMode === 'table' ? 'gallery' : 'table';
    }

    /**
     * Checks if all rows are selected
     */
    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows && numRows > 0;
    }

    /**
     * Selects all rows if they are not all selected; otherwise clear selection
     */
    masterToggle(): void {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.dataSource.data.forEach(row => this.selection.select(row));
        }
    }

    /**
     * Adds a notification
     */
    addNotification(notification: Notification): void {
        this.notifications.push(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
    }

    /**
     * Removes a notification
     */
    removeNotification(notification: Notification): void {
        const index = this.notifications.indexOf(notification);
        if (index !== -1) {
            this.notifications.splice(index, 1);
        }
    }

    /**
     * Opens the file preview
     */
    openPreview(file: FileItem): void {
        this.previewFile = file;

        // Find the index of the current file
        this.currentPreviewIndex = this.files.findIndex(f => f.id === file.id);

        // Check if there's a custom preview component for this file type
        if (this.config.previewComponents && this.config.previewComponents[file.type]) {
            this.previewComponentType = this.config.previewComponents[file.type];

            // Create injector with fileItem
            this.previewComponentInjector = Injector.create({
                providers: [
                    { provide: 'fileItem', useValue: file }
                ],
                parent: this.injector
            });

            console.log('Opening preview for file:', file);
            console.log('Using component:', this.previewComponentType.name);
        } else {
            this.previewComponentType = null;
            this.previewComponentInjector = undefined;
        }
    }


    /**
     * Closes the file preview
     */
    closePreview(): void {
        this.previewFile = null;
        this.previewComponentType = null;
        this.previewComponentInjector = undefined;

        if (this.previewComponentRef) {
            this.previewComponentRef.destroy();
            this.previewComponentRef = null;
        }
    }


    /**
     * Checks if a file has a preview available
     */
    hasPreview(file: FileItem): boolean {
        // Check if file has a preview image/url
        if (file.preview) {
            return true;
        }

        // Check if there's a custom preview component for this file type
        if (this.config.previewComponents && this.config.previewComponents[file.type]) {
            return true;
        }

        return false;
    }

    /**
 * Navigates to the previous or next file in the preview
 */
    navigatePreview(direction: number): void {
        const newIndex = this.currentPreviewIndex + direction;

        if (newIndex >= 0 && newIndex < this.files.length) {
            this.currentPreviewIndex = newIndex;
            this.previewFile = this.files[newIndex];

            // Check if there's a custom preview component for this file type
            if (this.config.previewComponents && this.config.previewComponents[this.previewFile.type]) {
                this.previewComponentType = this.config.previewComponents[this.previewFile.type];

                // Create injector with fileItem
                this.previewComponentInjector = Injector.create({
                    providers: [
                        { provide: 'fileItem', useValue: this.previewFile }
                    ],
                    parent: this.injector
                });
            } else {
                this.previewComponentType = null;
                this.previewComponentInjector = undefined;
            }
        }
    }


    /**
     * Gets the appropriate icon for a file
     */
    getFileIcon(file: FileItem): string {
        return this.fileUtilsService.getFileIcon(file.file);
    }

    /**
     * Gets the CSS class for a file item
     */
    getFileItemClass(file: FileItem): string {
        return file.isValid ? 'valid-file' : 'invalid-file';
    }

    /**
     * Gets the tooltip text for a file
     */
    getFileTooltip(file: FileItem): string {
        if (!file.isValid) {
            return `Invalid: ${file.validationReason}`;
        }
        return file.name;
    }

    /**
     * Formats file size to human-readable format
     */
    formatFileSize(bytes: number): string {
        return this.fileUtilsService.formatFileSize(bytes);
    }

    /**
     * Gets the file extension from a file name
     */
    private getFileExtension(filename: string): string {
        return filename.split('.').pop() || '';
    }

    /**
     * Generates a unique ID for a file
     */
    private generateUniqueId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Gets the count of valid files
     */
    getValidFilesCount(): number {
        return this.files.filter(file => file.isValid).length;
    }

    /**
     * Gets the count of invalid files
     */
    getInvalidFilesCount(): number {
        return this.files.filter(file => !file.isValid).length;
    }

    /**
     * Gets the total size of all files
     */
    getTotalFileSize(): number {
        return this.files.reduce((total, file) => total + file.size, 0);
    }

    /**
     * Checks if there are any selected files
     */
    hasSelection(): boolean {
        return this.selection.hasValue();
    }

    /**
     * Checks if the confirm button should be enabled
     */
    canConfirm(): boolean {
        // Check if there are any files
        if (this.files.length === 0) {
            return false;
        }

        // Check if all files are valid
        if (this.files.some(file => !file.isValid)) {
            return false;
        }

        // Check if loading
        if (this.isLoading) {
            return false;
        }

        return true;
    }

    /**
     * Confirms the upload and closes the dialog
     */
    confirm(): void {
        // Return only valid files
        const validFiles = this.files.filter(file => file.isValid);
        this.dialogRef.close(validFiles);
    }
}

