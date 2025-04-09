import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { UploadModalComponent } from '../../shared/components/upload-modal/upload-modal.component';
import { FileItem, ServerValidationResult, UploadModalConfig } from '../../shared/models/upload-modal.models';
import { JsonPreviewComponent } from '../../shared/components/preview-components/json-preview/json-preview.component';

@Component({
  selector: 'app-example',
  templateUrl: './upload-example.component.html',
  styleUrls: ['./upload-example.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ]
})
export class ExampleComponent {
  /**
   * Selected files from the upload modal
   */
  selectedFiles: FileItem[] = [];

  constructor(private dialog: MatDialog) { }

  /**
  * Opens the upload modal with basic configuration
  */
  openBasicUploadModal(): void {
    const dialogRef = this.dialog.open(UploadModalComponent, {
      width: '90%',
      maxWidth: '1200px',
      height: '90%',
      data: {
        title: 'Upload Files',
        acceptedFormats: 'image/*,.pdf,.docx,.xlsx',
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 10
      } as UploadModalConfig
    });

    dialogRef.afterClosed().subscribe((result: FileItem[] | undefined) => {
      if (result) {
        this.selectedFiles = result;
        console.log('Selected files:', this.selectedFiles);
      }
    });
  }

  /**
   * Opens the upload modal with advanced configuration
   */
  openAdvancedUploadModal(): void {
    const dialogRef = this.dialog.open(UploadModalComponent, {
      width: '90%',
      maxWidth: '1200px',
      height: '90%',
      data: {
        title: 'Advanced File Upload',
        acceptedFormats: '.json,.jpg,.png,.pdf',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 20,
        allowOnlyValidFiles: true,
        previewComponents: {
          'application/json': JsonPreviewComponent
        },
        validateFile: (file: FileItem) => {
          // Example custom validation
          if (file.name.includes('confidential')) {
            return { isValid: false, reason: 'Confidential files are not allowed' };
          }
          return { isValid: true, reason: '' };
        },
        validateFilesOnServer: async (files: FileItem[]): Promise<ServerValidationResult> => {
          // Simulate server validation with a delay
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Example: Mark files larger than 2MB as invalid
          const invalidFiles = files.filter(file => file.size > 2 * 1024 * 1024);

          // Preparar mensagem de erro se houver arquivos inválidos
          let reason = '';
          if (invalidFiles.length > 0) {
            reason = `${invalidFiles.length} file(s) exceed recommended size of 2MB`;
          }

          // Preparar dados adicionais para retornar ao componente
          const fileData = files.map(file => {
            const isLargeFile = file.size > 2 * 1024 * 1024;
            return {
              id: file.id,
              isValid: !isLargeFile,
              validationReason: isLargeFile ? 'File exceeds recommended size of 2MB' : '',
              serverProcessed: true
            };
          });

          return {
            isValid: invalidFiles.length === 0,
            reason: reason,
            data: fileData
          };
        },
        texts: {
          dropZoneText: 'Drop your files here or click to browse your device',
          browseFilesButton: 'Select Files',
          confirmButton: 'Upload Files',
          cancelButton: 'Cancel Upload'
        }
      } as UploadModalConfig
    });

    dialogRef.afterClosed().subscribe((result: FileItem[] | undefined) => {
      if (result) {
        this.selectedFiles = result;
        console.log('Selected files:', this.selectedFiles);
        // Example: Upload files to server
        this.uploadFilesToServer(this.selectedFiles);
      }
    });
  }

  /**
   * Example method to upload files to a server
   * @param files Files to upload
   */
  private async uploadFilesToServer(files: FileItem[]): Promise<void> {
    console.log('Uploading files to server...');

    // Example implementation using FormData
    const formData = new FormData();

    files.forEach(fileItem => {
      formData.append('files', fileItem.file, fileItem.name);
    });

    // Add any additional data
    formData.append('userId', 'user123');
    formData.append('timestamp', Date.now().toString());

    try {
      // Example: Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real application, you would use HttpClient to post the data
      // this.http.post('https://api.example.com/upload', formData).subscribe(...)

      console.log('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  }
}
