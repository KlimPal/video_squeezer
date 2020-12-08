import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormType1Component } from './form-type1/form-type1.component'

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableType1Component } from './table-type1/table-type1.component';
import { LoadingType1Component } from './loading-type1/loading-type1.component';

import { MatModule } from "./mat.module";
import { ScrollingModule } from '@angular/cdk/scrolling';

import { ImgFallbackDirectiveDirective } from './directives/img-fallback-directive.directive';
import { ImagePopupComponent } from './image-popup/image-popup.component';
import { SnackbarType1Component } from './snackbar-type1/snackbar-type1.component'

@NgModule({
    declarations: [
        FormType1Component,
        TableType1Component,
        LoadingType1Component,
        ImgFallbackDirectiveDirective,
        ImagePopupComponent,
        SnackbarType1Component,
    ],
    imports: [
        CommonModule,
        MatModule,
        FormsModule,
        ReactiveFormsModule,
        ScrollingModule,
    ],
    exports: [
        FormType1Component,
        TableType1Component,
        LoadingType1Component,
        MatModule,
        FormsModule,
        ReactiveFormsModule,
        ImgFallbackDirectiveDirective,
    ]
})
export class UiModule {}
