import { Component, OnInit, OnDestroy } from '@angular/core';
import { sendWsMsg } from '../../utils/sharedSocket'
import { msgUtils, http, cryptoUtils, cf } from '../../utils/cf'
import _ from 'lodash'
import { EventsService } from '../../services/events.service'

import { Router } from '@angular/router';
import { appState } from '../../globalConfig'

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit, OnDestroy {

    constructor(
        eventsService: EventsService,
        private router: Router
    ) {
        const subscription = eventsService.events.CONVERTED_FILE_READY_TO_DOWNLOAD.subscribe(async data => {
            console.log(data);
            const text = `File ${data.convertedFile?.originalFileName} converted.`
                + ` Size: ${cf.getFriendlyFileSize(+data.convertedFile?.size)}`
                + `\nDownload now?`

            let shouldDownloadFile = await msgUtils.confirm(text)
            if (!shouldDownloadFile) {
                return
            }
            const a = document.createElement("a");
            a.href = data.linkToDownload
            a.download = data.convertedFile?.originalFileName
            a.click()
        })
        this.eventsSubscriptions.push(subscription)
    }

    ngOnInit(): void {

        this.loadConvertingJobList()
    }

    ngOnDestroy() {
        this.eventsSubscriptions.forEach(subscription => {
            subscription.unsubscribe()
        })
    }

    eventsSubscriptions = []
    fileUploadingNow = false;
    uploadStatusText = ''

    videoSizeOptions = [
        { value: '240', label: '240p' },
        { value: '480', label: '480p' },
        { value: '576', label: '576p' },
        { value: '720', label: '720p HD' },
        { value: '1080', label: '1080p Full HD' },
        { value: '2160', label: '2160p 4K' }
    ]
    crfOptions = [
        { value: '29', label: 'Very Low' },
        { value: '26', label: 'Low' },
        { value: '23', label: 'Medium' },
        { value: '20', label: 'High' },
        { value: '17', label: 'Very High' },
    ]
    convertingJobs = []

    //_.range(17, 28).map(n => ({
    //     value: n,
    //     label: `${n}`
    // }))

    compressOptions = {
        size: '720',
        crf: '23',
    }

    fileInfo = {
        id: null,
        name: null,
        size: 0,
        sizeAsString: ''
    }

    isButtonCompressDisabled = true;

    async compressVideo() {
        let res = await sendWsMsg('video.compress', {
            fileId: this.fileInfo.id,
            compressOptions: this.compressOptions
        })

        if (!res.result) {
            msgUtils.alert(res.error || 'error', { details: res.details })
        } else {
            msgUtils.success('Job created')
        }
        this.isButtonCompressDisabled = true;
        this.fileInfo = {
            id: null,
            name: null,
            size: 0,
            sizeAsString: ''
        }
    }

    async loadConvertingJobList() {
        let res = await sendWsMsg('video.getOwnConvertingJobs', {})
        if (!res.result) {
            msgUtils.alert(res.error || 'error', { details: res.details })
            return
        }
        this.convertingJobs = res.result

        console.log(res.result)


    }
    async logout() {
        sendWsMsg('authentication.logout', { token: appState.user.token }).then((data) => {
            //console.log(data);
        })
        appState.user = {
            userId: '',
            userName: '',
            token: '',
            sessionId: '',
        }
        localStorage.setItem('token', '')
        this.router.navigateByUrl('/login')
    }

    async handleFileSelect(event) {
        //console.log(this.jobOptions);

        let file = event.target.files[0];
        if (!file) {
            return;
        }
        this.fileInfo.name = file.name;
        this.fileInfo.sizeAsString = cf.getFriendlyFileSize(file.size)

        this.fileUploadingNow = true

        let res = await sendWsMsg('files.getOwnFiles', {})
        if (!res.result) {
            msgUtils.alert(res.error || 'error', { details: res.details })
            this.uploadStatusText = '';
            this.fileUploadingNow = false
            return
        }
        let ownFiles = res.result
        const hashSkipSize = 1024 * 1024 * 200;

        let filesWithSameLength = ownFiles.filter(el => el.size > hashSkipSize && Number(el.size) === file.size && el.hash)
        let hash
        if (filesWithSameLength.length === 1) {
            hash = filesWithSameLength[0].hash
        } else {
            this.uploadStatusText = 'calculating md5...'
            hash = await cryptoUtils.mMd5HashOfFile(file, {
                chunkSize: 1024 * 1024 * 5,
                progressCallback: (progress) => {
                    let percents = Math.round(progress * 100);
                    this.uploadStatusText = `calculating md5: ${percents}%`
                },
                chunkNumberIncrement: 20
            })

        }

        res = await sendWsMsg('files.getPartialUpload', {
            fileHash: hash,
            fileSize: file.size,
            fileName: file.name,
        })

        if (!res.result) {
            if (res.error === 'ALREADY_EXISTS' && res.details.id) {
                this.fileInfo.id = res.details.id
                this.isButtonCompressDisabled = false
            } else {
                msgUtils.alert(res.error || 'error', { details: res.details })
            }

            this.uploadStatusText = '';
            this.fileUploadingNow = false
            return
        }

        let { uploadParts, fileId } = res.result

        uploadParts = uploadParts.sort((a, b) => a.rangeStart - b.rangeStart)

        for (let i = 0; i < uploadParts.length; i++) {
            let part = uploadParts[i]
            this.uploadStatusText = `uploading ${i + 1}/${uploadParts.length} chunk`
            if (part.status === 'UPLOADED') {
                continue
            }
            let blobPart = file.slice(part.rangeStart, part.rangeEnd)
            await http.putFileUsingPresignedUrl(part.presignedPutUrl, blobPart)

            await sendWsMsg('files.completeFilePart', {
                filePartId: part.filePartId,
            })

        }

        this.uploadStatusText = 'merging chunks';
        res = await sendWsMsg('files.completePartialUpload', {
            fileId,
            fileName: file.name
        })

        if (!res.result) {
            msgUtils.alert(res.error || 'error', { details: res.details })
            this.uploadStatusText = '';
            this.fileUploadingNow = false
            return
        } else {
            this.fileInfo.id = res.result.id
            this.isButtonCompressDisabled = false
            // msgUtils.alert('done', { details: res.result })
        }

        // await http.putFileUsingPresignedUrl(url, file)

        this.uploadStatusText = '';
        this.fileUploadingNow = false
    }

}
