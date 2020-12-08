import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {IncidentListComponent} from './incident-list.component'

const routes: Routes = [{ path: '', component: IncidentListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IncidentListRoutingModule { }
