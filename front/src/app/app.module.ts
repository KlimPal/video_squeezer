import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { UiModule } from './clear_modules/ui.module'
import { BaseModule } from './base/base.module';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        FormsModule,
        BrowserModule,
        AppRoutingModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        BrowserAnimationsModule,
        UiModule,
        BaseModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {}
