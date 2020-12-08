import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FooterMenuComponent } from './base/footer-menu/footer-menu.component'
import { ProfileComponent } from './base/profile/profile.component'
import { AuthenticationComponent } from './base/authentication/authentication.component'
import { AuthGuard } from './base/authentication/auth-guard.service';

const routes: Routes = [

    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    //{ path: 'map', canActivate: [AuthGuard], loadChildren: () => import('./modules/map/map.module').then(m => m.MapModule) },
    { path: 'login', component: AuthenticationComponent, canActivate: [AuthGuard] },
    { path: '', component: AuthenticationComponent, canActivate: [AuthGuard] },
    { path: 'authentication/google/callback', component: AuthenticationComponent, canActivate: [AuthGuard], },
    { path: '**', component: AuthenticationComponent, canActivate: [AuthGuard] },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule],
    providers: [AuthGuard],
})
export class AppRoutingModule { }
