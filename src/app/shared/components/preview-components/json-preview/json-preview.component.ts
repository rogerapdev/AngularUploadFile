import { Component, OnInit, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileItem } from '../../../models/upload-modal.models';

@Component({
  selector: 'app-json-preview',
  templateUrl: './json-preview.component.html',
  styleUrls: ['./json-preview.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class JsonPreviewComponent implements OnInit {
  /**
   * File to preview
   */
  @Input() file?: File;

  /**
   * File item with metadata
   */
  @Input() fileItem?: FileItem;

  /**
   * Whether to use dark theme
   */
  @Input() darkTheme = false;

  /**
   * Formatted JSON string
   */
  formattedJson = '';

  /**
   * Parsed JSON data
   */
  jsonData: any = null;

  /**
   * Whether JSON is expanded
   */
  isExpanded = true;

  constructor(@Inject('fileItem') private injectedFileItem?: FileItem) { }

  /**
   * Lifecycle hook that is called when component initializes
   */
  ngOnInit(): void {
    // Use injected fileItem if available, otherwise use @Input fileItem
    const fileItem = this.injectedFileItem || this.fileItem;

    if (fileItem && fileItem.file) {
      this.file = fileItem.file;
      this.loadJsonContent();
    } else if (this.file) {
      this.loadJsonContent();
    }
  }

  /**
   * Loads and parses JSON content from file
   */
  loadJsonContent(): void {
    if (!this.file) {
      console.error('No file provided for JSON preview');
      this.formattedJson = 'Error: No file provided';
      return;
    }

    console.log('Loading JSON content from file:', this.file.name);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content = e.target?.result as string;
        this.jsonData = JSON.parse(content);
        this.formattedJson = JSON.stringify(this.jsonData, null, 2);
        console.log('JSON loaded successfully, length:', this.formattedJson.length);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        this.formattedJson = 'Error parsing JSON: ' + (error instanceof Error ? error.message : String(error));
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.formattedJson = 'Error reading file';
    };

    reader.readAsText(this.file);
  }


  /**
   * Expands all JSON nodes
   */
  expandAll(): void {
    this.isExpanded = true;
    if (this.jsonData) {
      this.formattedJson = JSON.stringify(this.jsonData, null, 2);
    }
  }

  /**
   * Collapses all JSON nodes
   */
  collapseAll(): void {
    this.isExpanded = false;
    if (this.jsonData) {
      this.formattedJson = JSON.stringify(this.jsonData);
    }
  }

  /**
   * Copies JSON to clipboard
   */
  copyToClipboard(): void {
    navigator.clipboard.writeText(this.isExpanded ? this.formattedJson : JSON.stringify(this.jsonData))
      .then(() => {
        console.log('JSON copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy JSON: ', err);
      });
  }
}
