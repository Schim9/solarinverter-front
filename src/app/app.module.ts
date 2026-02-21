import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {CallApi} from './services/callApi';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {BarChartComponent} from './barChart/barChart.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MAT_DATE_LOCALE, MatNativeDateModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {LiveStatComponent} from './LiveStat/liveStat.component';
import {ToolsBoxService} from './services/toolbox';
import {MatInputModule} from '@angular/material/input';



@NgModule({ declarations: [
        AppComponent, BarChartComponent, LiveStatComponent
    ],
    exports: [],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatNativeDateModule,
        MatDatepickerModule,
        MatSlideToggleModule,
        MatInputModule], providers: [
        CallApi,
        ToolsBoxService,
        { provide: MAT_DATE_LOCALE, useValue: 'fr' },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule { }
