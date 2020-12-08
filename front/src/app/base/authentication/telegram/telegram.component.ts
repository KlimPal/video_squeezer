import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject, NgZone } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { sendWsMsg } from '../../../utils/sharedSocket'
import { msgUtils } from '../../../utils/cf'

@Component({
    selector: 'app-telegram',
    templateUrl: './telegram.component.html',
    styleUrls: ['./telegram.component.css']
})
export class TelegramComponent implements OnInit, AfterViewInit {
    @ViewChild('tgAnchor', { static: true }) tgAnchor: ElementRef;

    constructor(
        public dialogRef: MatDialogRef < TelegramComponent > ,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public zone: NgZone,
    ) {}

    ngOnInit(): void {}

    ngAfterViewInit() {
        this.initTgScript()
    }

    initTgScript() {
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?7'
        script.setAttribute('data-telegram-login', 'local_incidents_login_bot')
        script.setAttribute('data-size', 'large')
        script.setAttribute('data-onauth', 'loginViaTelegram(user)')
        script.setAttribute('data-request-access', 'write')
        this.tgAnchor.nativeElement.appendChild(script)
        window['loginViaTelegram'] = (data) => { this.loginViaTelegram(data) }
    }
    close() {
        this.dialogRef.close()
    }

    loginViaTelegram(data) {
        this.zone.run(() => {
            this.dialogRef.close(data)
        })
    }

}
