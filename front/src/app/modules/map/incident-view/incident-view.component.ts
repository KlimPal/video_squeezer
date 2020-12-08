import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { sendWsMsg } from '../../../utils/sharedSocket'
import { msgUtils, cf, dateUtils } from '../../../utils/cf'
import { appState, nodeRootAddress } from '../../../globalConfig'
import { formatDate } from '@angular/common';
import { UiService } from '../../../clear_modules/ui.service'
import { getResizedUrlOfImg } from '../../../utils/imgproxy'
@Component({
    selector: 'app-incident-view',
    templateUrl: './incident-view.component.html',
    styleUrls: ['./incident-view.component.css']
})
export class IncidentViewComponent implements OnInit, OnDestroy {

    constructor(
        public dialogRef: MatDialogRef<IncidentViewComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private uiService: UiService
    ) { }

    incident = {
        incidentId: '',
        title: '',
        description: '',
        authorId: '',
        statistic: {
            views: 0
        },
        timeToExpiration: '',
        photoUrl: '',
        recognizedObjects: null,
        recognizedObjectsAsString: '',
    }
    isOwnIncident = false;

    author = {
        userName: '',
        photoUrl: '',
        smallPhotoUrl: '',
    }

    intervals = []

    ngOnInit(): void {
        this.initIncident()

    }

    async initAuthorInfo(author) {
        let data = await sendWsMsg('user.get', { userId: author })
        if (data.result) {
            this.author = { ...this.author, ...data.result }
            if (data.result.photoUrl.indexOf('http') !== 0) {
                this.author.photoUrl = nodeRootAddress + '/' + data.result.photoUrl
            }
            this.author.smallPhotoUrl = getResizedUrlOfImg(this.author.photoUrl, { width: 100 })

        } else {
            msgUtils.alert(data.error || 'error while fetching author info')
        }
    }

    zoomAuthorPhoto(imgSrc) {
        this.uiService.showImgPopup(imgSrc)
    }

    getTimeToExpirationAsString(date) {
        return dateUtils.msToStringDelay(Math.max(date - Date.now(), 0), { showSeconds: false })
    }

    async initIncident() {
        this.incident = { ...this.incident, ...this.data.incident }
        this.isOwnIncident = appState.user.userId == this.incident.authorId

        this.initAuthorInfo(this.incident.authorId)
        await sendWsMsg('incident.increaseViews', { incidentId: this.data.incident.incidentId })
        let data = await sendWsMsg('incident.get', { incidentId: this.data.incident.incidentId })
        if (data.result && data.result[0]) {
            this.incident = {
                ...this.incident,
                ...data.result[0],

            }
        }
        this.incident.recognizedObjectsAsString = Object.keys(this.incident.recognizedObjects || {}).map(el => '#' + el).join(' ')

        let terminationDate = new Date(this.incident['terminationDate'])
        this.incident.timeToExpiration = this.getTimeToExpirationAsString(terminationDate)
        this.intervals.push(setInterval(() => {
            this.incident.timeToExpiration = this.getTimeToExpirationAsString(terminationDate)
        }, 1000))

    }

    async removeIncident() {
        let result = await msgUtils.confirm('Do you really want to delete this incident?')
        if (result !== true) {
            return
        }
        let data = await sendWsMsg('incident.remove', { incidentId: this.incident.incidentId })
        if (data.result == 'ok') {
            this.dialogRef.close({ deleteIncident: true })
        }
    }

    ngOnDestroy() {
        this.intervals.forEach(el => clearInterval(el))
    }

    close() {
        this.dialogRef.close()
    }

}
