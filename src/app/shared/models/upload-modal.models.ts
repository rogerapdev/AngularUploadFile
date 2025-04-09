import { Type } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/**
 * Configuration for the upload modal
 */
export interface UploadModalConfig {
    /**
     * Title of the modal
     */
    title?: string;

    /**
     * Accepted file formats (e.g. '.jpg,.png,.pdf' or '*')
     */
    acceptedFormats?: string;

    /**
     * Maximum file size in bytes (0 for unlimited)
     */
    maxFileSize?: number;

    /**
     * Maximum number of files (0 for unlimited)
     */
    maxFiles?: number;

    /**
     * Whether to allow only valid files to be confirmed
     */
    allowOnlyValidFiles?: boolean;

    /**
     * File name format pattern (for display purposes)
     */
    fileNameFormat?: string;

    /**
     * Custom client-side file validation function
     */
    validateFile?: ((file: FileItem) => Promise<ValidationResult> | ValidationResult) | null;

    /**
     * Custom server-side file validation function
     */
    validateFileOnServer?: ((file: FileItem) => Promise<ServerValidationResult>) | null;

    /**
     * Custom server-side batch validation function
     */
    validateFilesOnServer?: ((files: FileItem[]) => Promise<ServerValidationResult>) | null;

    /**
     * Custom preview components for specific file types
     */
    previewComponents?: { [fileType: string]: Type<any> };

    /**
     * Custom text labels
     */
    texts?: {
        dropZoneText?: string;
        orText?: string;
        browseFilesButton?: string;
        cancelButton?: string;
        confirmButton?: string;
        filesLabel?: string;
        selectedLabel?: string;
        validLabel?: string;
        invalidLabel?: string;
        totalSizeLabel?: string;
        acceptedFormatsLabel?: string;
        maxFileSizeLabel?: string;
        maxFilesLabel?: string;
        fileNameFormatLabel?: string;
        nameHeader?: string;
        typeHeader?: string;
        sizeHeader?: string;
        actionsHeader?: string;
        previewTooltip?: string;
        removeTooltip?: string;
        tableView?: string;
        galleryView?: string;
        removeSelectedButton?: string;
        validStatus?: string;
        invalidStatus?: string;
        noFilesSelected?: string;
    };
}

/**
 * Represents a file item in the upload modal
 */
export interface FileItem {
    /**
     * Unique identifier for the file
     */
    id: string;

    /**
     * The actual File object
     */
    file: File;

    /**
     * File name
     */
    name: string;

    /**
     * File size in bytes
     */
    size: number;

    /**
     * File MIME type or extension
     */
    type: string;

    /**
     * Preview URL for the file (for images and PDFs)
     */
    preview: SafeUrl;

    /**
     * Whether the file is valid
     */
    isValid: boolean;

    /**
     * Reason why the file is invalid (if applicable)
     */
    validationReason: string;

    /**
     * Additional data that can be attached to the file
     */
    [key: string]: any;
}

/**
 * Result of file validation
 */
export interface ValidationResult {
    /**
     * Whether the file is valid
     */
    isValid: boolean;

    /**
     * Reason why the file is invalid (if applicable)
     */
    reason: string;
}

/**
 * Result of server-side file validation
 */
export interface ServerValidationResult extends ValidationResult {
    /**
     * Additional data returned from the server
     */
    data?: any;
}

/**
 * Notification displayed in the upload modal
 */
export interface Notification {
    /**
     * Type of notification
     */
    type: 'error' | 'info';

    /**
     * Notification message
     */
    message: string;
}
