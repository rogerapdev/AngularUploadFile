import { Routes } from '@angular/router';
import { ExampleComponent } from './examples/upload-example/upload-example.component';

export const routes: Routes = [
  { path: '', component: ExampleComponent },
  { path: '**', redirectTo: '' }
];
