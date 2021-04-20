import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterMenuComponent } from './footer-menu/footer-menu.component';
import { UiModule } from '../clear_modules/ui.module'

import { RouterModule } from '@angular/router';
import { AuthenticationComponent } from './authentication/authentication.component';
import { ProfileComponent } from './profile/profile.component';
import { TelegramComponent } from './authentication/telegram/telegram.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
    declarations: [FooterMenuComponent, AuthenticationComponent, ProfileComponent, TelegramComponent, FileUploadComponent],
    imports: [
        CommonModule,
        UiModule,
        RouterModule,
        BrowserModule,
        BrowserAnimationsModule
    ],
    exports: [
        FooterMenuComponent
    ]
})
export class BaseModule { }
