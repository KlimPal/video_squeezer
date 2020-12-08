import { Injectable, Component, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImagePopupComponent } from './image-popup/image-popup.component'
import {
    MatSnackBar,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { SnackbarType1Component } from './snackbar-type1/snackbar-type1.component'
import { dateUtils } from '../utils/cf'

@Injectable({
    providedIn: 'root'
})
export class UiService {

    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar) {

    }

    async showImgPopup(imgSrc) {
        let dialogRef = this.dialog.open(ImagePopupComponent, {
            width: 'auto',
            minWidth: '320px',
            maxWidth: '100vw',
            height: 'auto',
            hasBackdrop: true,
            panelClass: ['clearDialog', 'noShadow'],
            disableClose: false,
            data: {
                imgSrc: imgSrc,
            }
        });
        let data = await dialogRef.afterClosed().toPromise()
        return data
    }
    openUndoSnackBar({
        message,
        action,
        duration = 2000,
    }) {
        return new Promise((resolve, reject) => {
            let horizontalPosition: MatSnackBarHorizontalPosition = 'center';
            let verticalPosition: MatSnackBarVerticalPosition = 'top';

            let start = Date.now()
            let data = {
                message,
                action,
                snackBarRef: null,
            }
            let fun = ()=>{
                let ms = Math.max(start + duration - Date.now(), 0)
                data.message = message + ' (' + dateUtils.msToStringDelay(ms) + ')'
            }
            fun()
            let interval = setInterval(() => {
                fun()
            }, 500)
            let snackBarRef = this.snackBar.openFromComponent(SnackbarType1Component, {
                duration,
                horizontalPosition,
                verticalPosition,
                panelClass: ['qqq', 'undoSnackBar'],
                data: data,
            });
            data.snackBarRef = snackBarRef


            setTimeout(()=>{
                clearInterval(interval)
            }, duration)

            snackBarRef.afterDismissed().subscribe(() => {
                clearInterval(interval)
                resolve(false)
            });
            snackBarRef.onAction().subscribe(() => {
                clearInterval(interval)
                resolve(true)
            });
        })

    }

}
