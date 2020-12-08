import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { sendWsMsg } from '../../utils/sharedSocket'
import { msgUtils, cf } from '../../utils/cf'
import { Router, ActivatedRoute } from '@angular/router';
import { appState } from '../../globalConfig'
import { TelegramComponent } from './telegram/telegram.component'
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-authentication',
    templateUrl: './authentication.component.html',
    styleUrls: ['./authentication.component.css']
})

export class AuthenticationComponent implements OnInit {
    @ViewChild('tgAnchor', { static: true }) tgAnchor: ElementRef;

    constructor(
        private router: Router,
        private dialog: MatDialog,
        public zone: NgZone,
    ) {}

    ngOnInit() {

    }

    async googleAuth() {
        let res = await sendWsMsg('authentication.getOauthUrl', { type: 'google' })
        if (res.result) {
            window.open(res.result, '_self');
        } else {
            msgUtils.alert(res.error || 'error')
        }
    }
    openTgDialog() {
        let dialogRef = this.dialog.open(TelegramComponent, {
            width: 'auto',
            minWidth: '320px',
            maxWidth: '100vw',
            height: 'auto',
            hasBackdrop: true,
            panelClass: 'clearDialog',
            disableClose: true,
            data: {

            }
        });
        dialogRef.afterClosed().subscribe(async (tgData) => {
            if (tgData && tgData.id) {
                let data = await sendWsMsg('authentication.getToken', { telegramAuthData: tgData })
                if (data.result) {
                    this.router.navigateByUrl(`/?token=${data.result}`) // Navigate to "/" to enforce canActivate() call
                } else {
                    msgUtils.alert(data.error || 'error')
                }
            }
        })
    }

}
