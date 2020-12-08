import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-image-popup',
    templateUrl: './image-popup.component.html',
    styleUrls: ['./image-popup.component.css']
})
export class ImagePopupComponent implements OnInit {

    constructor(
        public dialogRef: MatDialogRef < ImagePopupComponent > ,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.imgSrc = data.imgSrc
    }
    imgSrc = ''

    ngOnInit(): void {

    }

}
