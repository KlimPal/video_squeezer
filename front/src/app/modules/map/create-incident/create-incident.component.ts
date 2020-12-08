import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { sendWsMsg } from '../../../utils/sharedSocket'
import { msgUtils, cf, http } from '../../../utils/cf'
import { currentLocation } from '../location'
import { fake } from 'faker'

@Component({
    selector: 'app-create-incident',
    templateUrl: './create-incident.component.html',
    styleUrls: ['./create-incident.component.css']
})
export class CreateIncidentComponent implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<CreateIncidentComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {

    }

    attachment = {
        file: null,
        photoAsBase64: '',
    }

    info = {
        title: '',
        description: '',
        duration: 1000 * 60,
        radius: 100,
        attachedFileId: ''
    }
    durationOptions = [{
        name: '1m',
        value: 1000 * 60
    }, {
        name: '5m',
        value: 1000 * 60 * 5
    }, {
        name: '10m',
        value: 1000 * 60 * 10
    }, {
        name: '20m',
        value: 1000 * 60 * 20
    }, {
        name: '30m',
        value: 1000 * 60 * 30
    }, {
        name: '1h',
        value: 1000 * 60 * 60
    }, {
        name: '2h',
        value: 1000 * 60 * 60 * 2
    }]

    radiusOptions = [{
        name: '10m',
        value: 10
    }, {
        name: '50m',
        value: 50
    }, {
        name: '100m',
        value: 100
    }, {
        name: '200m',
        value: 200
    }, {
        name: '500m',
        value: 500
    }, {
        name: '1km',
        value: 1000
    }]

    close() {
        this.dialogRef.close()
    }
    async createIncident() {

        if (this.attachment.file) {
            let res = await sendWsMsg('files.getPresignedPutObjectUrl')
            if (!res.result) {
                msgUtils.alert(res.error || 'error', { details: res.details })
                return
            }
            let { url, fileId } = res.result
            await http.putFileUsingPresignedUrl(url, this.attachment.file)
            this.info.attachedFileId = fileId
        }



        let data = { ...this.info }
        let res = await sendWsMsg('incident.create', {
            ...data,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
        })
        if (res.result) {
            this.dialogRef.close(res.result)
            msgUtils.log('Done')

            //let data = await sendWsMsg('incident.get', {})
            //console.log(data);
        } else {
            msgUtils.alert(res.error || 'error', { details: res.details })
        }
    }

    async test() {
        for (let i = 0; i < 10000; i++) {
            //await cf.sleep(1)
            await sendWsMsg('incident.create', {
                title: fake("{{hacker.verb}} {{hacker.noun}}"),
                description: fake("{{lorem.sentences}}"),
                duration: 1000 * 60 * 60 * 2,
                radius: 100,
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
            })
            currentLocation.latitude += (i % 2 ? -1 : 1) * Math.random() * 0.01
            currentLocation.longitude += (i % 2 ? -1 : 1) * Math.random() * 0.01
        }

    }

    async handleFileSelect(event) {
        let files = event.target.files;
        if (files.length == 0) {
            this.info.attachedFileId = ''
            this.attachment.photoAsBase64 = ''
            this.attachment.file = null
            return;
        }

        this.attachment.file = files[0]
        let fileReader = new FileReader()
        fileReader.readAsDataURL(files[0])
        fileReader.onload = async () => {
            this.attachment.photoAsBase64 = '' + fileReader.result
        }
    }

    ngOnInit() {
        //this.test()

    }

}
