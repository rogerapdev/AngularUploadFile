import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FileUtilsService {

    constructor() { }

    /**
     * Checks if a file is an image
     */
    isImageFile(file: File | { type: string, name: string }): boolean {
        // Check by MIME type
        if (file.type.startsWith('image/')) {
            return true;
        }

        // Check by extension for cases where MIME type is not available
        const extension = this.getFileExtension(file.name).toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

        return imageExtensions.includes(extension);
    }

    /**
     * Checks if a file is a PDF
     */
    isPdfFile(file: File | { type: string, name: string }): boolean {
        // Check by MIME type
        if (file.type === 'application/pdf') {
            return true;
        }

        // Check by extension
        const extension = this.getFileExtension(file.name).toLowerCase();

        return extension === 'pdf';
    }

    /**
      * Checks if a file is a document (Word, Excel, PowerPoint, etc.)
      */
    isDocumentFile(file: File): boolean {
        const documentMimeTypes = [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/rtf',
            'text/plain',
            'text/rtf'
        ];

        if (documentMimeTypes.includes(file.type)) {
            return true;
        }

        // Check by extension
        const extension = this.getFileExtension(file.name).toLowerCase();
        return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].includes(extension);
    }

    /**
     * Gets the appropriate icon for a file
     */
    getFileIcon(file: File | { type: string, name: string }): string {
        // Image files
        if (this.isImageFile(file)) {
            return 'image';
        }

        // PDF files
        if (this.isPdfFile(file)) {
            return 'picture_as_pdf';
        }

        // Get by extension
        const extension = this.getFileExtension(file.name).toLowerCase();

        // Document files
        if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(extension)) {
            return 'description';
        }

        // Spreadsheet files
        if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) {
            return 'table_chart';
        }

        // Presentation files
        if (['ppt', 'pptx', 'odp'].includes(extension)) {
            return 'slideshow';
        }

        // Archive files
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
            return 'archive';
        }

        // Audio files
        if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
            return 'audio_file';
        }

        // Video files
        if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(extension)) {
            return 'video_file';
        }

        // Code files
        if (['html', 'css', 'js', 'ts', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'php'].includes(extension)) {
            return 'code';
        }

        // Default icon
        return 'insert_drive_file';
    }

    /**
     * Formats file size to human-readable format
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Gets the file extension from a file name
     */
    getFileExtension(filename: string): string {
        return filename.split('.').pop() || '';
    }
}
