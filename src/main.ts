import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

import { AppComponent } from './app/app.component';
import { CallApi } from './app/services/callApi';
import { ToolsBoxService } from './app/services/toolbox';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(MatNativeDateModule),
    CallApi,
    ToolsBoxService,
    { provide: MAT_DATE_LOCALE, useValue: 'fr' },
  ]
}).catch(err => console.error(err));
