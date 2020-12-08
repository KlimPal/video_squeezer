import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapRoutingModule } from './map-routing.module';
import { MapComponent } from './map.component';
import { UiModule } from '../../clear_modules/ui.module';
import { CreateIncidentComponent } from './create-incident/create-incident.component';
import { IncidentViewComponent } from './incident-view/incident-view.component'

@NgModule({
    declarations: [
        MapComponent,
        CreateIncidentComponent,
        IncidentViewComponent,
    ],
    imports: [
        CommonModule,
        MapRoutingModule,
        UiModule
    ]
})
export class MapModule {}
