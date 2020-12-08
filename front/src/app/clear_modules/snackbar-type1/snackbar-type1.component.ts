import { Component, OnInit, Inject} from '@angular/core';

import {MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';

@Component({
    selector: 'app-snackbar-type1',
    templateUrl: './snackbar-type1.component.html',
    styleUrls: ['./snackbar-type1.component.css']
})
export class SnackbarType1Component implements OnInit {


    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {
    }

    ngOnInit(): void {}
    close(){
        this.data.snackBarRef.dismissWithAction()
    }
}
