import { Component, OnInit, } from '@angular/core';
import { formatDate } from '@angular/common';
import { msgUtils, cf, dateUtils } from '../../utils/cf'
import { sendWsMsg } from '../../utils/sharedSocket'
import { appState } from '../../globalConfig'
import { Router } from '@angular/router';
import { getResizedUrlOfImg } from '../../utils/imgproxy'
import { UiService } from '../../clear_modules/ui.service'

let incidentsIdInRemoving = {}
@Component({
    selector: 'app-incident-list',
    templateUrl: './incident-list.component.html',
    styleUrls: ['./incident-list.component.css']
})

export class IncidentListComponent implements OnInit {

    constructor(
        private router: Router,
        private uiService: UiService
    ) {

    }

    incidents = []

    isLoading = false;

    ngOnInit(): void {
        this.preloadIncidents()
        window.addEventListener('scroll', this.handleScrollBinded, true);
    }
    ngOnDestroy() {
        window.removeEventListener('scroll', this.handleScrollBinded, true);
    }



    isPreloading = false;
    handleScroll(event) {
        if (this.isPreloading) {
            return
        }
        const distanceToPreload = 200;
        let el = event.srcElement
        if (el.scrollHeight - (el.clientHeight + el.scrollTop) < distanceToPreload) {
            this.isPreloading = true
            this.preloadIncidents()
        }
    }
    handleScrollBinded = this.handleScroll.bind(this)

    wrapLongString(str, maxLength = 40) {
        return str.replace(new RegExp(`(.{1,${maxLength}}\\s)`, 'g'), '$1\n')
    }


    async preloadIncidents() {
        let loaded = await await this.getOwnIncidents(10, this.incidents.length)
        this.incidents = [...this.incidents, ...loaded]
        this.isPreloading = false
    }

    async getOwnIncidents(limit = 10, offset = 0) {
        this.isLoading = true;
        let data = await sendWsMsg('incident.get', { author: appState.user.userId, allowOutdated: true, offset, limit })
        let dateNow = Date.now()
        let result = []
        if (data.result) {
            for (let incident of data.result) {
                //incident.description = this.wrapLongString(incident.description, 50)
                incident.dateAsString = formatDate(incident.date, 'MMM d, HH:mm', 'en-US')
                incident.radiusAsString = cf.getFriendlyDistance(incident.radius)
                incident.isActive = dateNow < incident.terminationDate
                incident.photoUrl = incident.photoUrl && getResizedUrlOfImg(incident.photoUrl, { width: 160 })
                incident.recognizedObjectsAsString = Object.keys(incident.recognizedObjects || {}).map(el => '#' + el).join(' ')
                incident.hidden = incidentsIdInRemoving[incident.incidentId]
            }

            result = data.result
        } else {
            msgUtils.alert(data.error || 'error')
        }
        this.isLoading = false;
        return result
    }

    async removeIncident(incident) {
        incidentsIdInRemoving[incident.incidentId] = true
        incident.hidden = true
        let userClickUndo = await this.uiService.openUndoSnackBar({
            message: 'Remove incident',
            action: 'Undo',
            duration: 8000
        })
        if (userClickUndo) {
            let old = this.incidents.find(el => el && el.incidentId == incident.incidentId)
            old && (old.hidden = false)
            delete incidentsIdInRemoving[incident.incidentId]
            return
        }
        let data = await sendWsMsg('incident.remove', { incidentId: incident.incidentId })
        delete incidentsIdInRemoving[incident.incidentId]
        if (data.result == 'ok') { } else {
            msgUtils.alert(data.error || 'error')
        }
    }

    openIncidentOnMap(incident) {
        this.router.navigateByUrl(`/map?incidentToOpen=${incident.incidentId}`)
    }

}
