import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterMenuComponent } from './footer-menu/footer-menu.component';
import { UiModule } from '../clear_modules/ui.module'

import { RouterModule } from '@angular/router';
import { AuthenticationComponent } from './authentication/authentication.component';
import { ProfileComponent } from './profile/profile.component';
import { TelegramComponent } from './authentication/telegram/telegram.component';

@NgModule({
    declarations: [FooterMenuComponent, AuthenticationComponent, ProfileComponent, TelegramComponent],
    imports: [
        CommonModule,
        UiModule,
        RouterModule
    ],
    exports: [
        FooterMenuComponent
    ]
})
export class BaseModule {}
