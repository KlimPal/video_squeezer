import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IncidentListRoutingModule } from './incident-list-routing.module';
import { UiModule } from '../../clear_modules/ui.module';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        IncidentListRoutingModule,
        UiModule
    ]
})
export class IncidentListModule {}
