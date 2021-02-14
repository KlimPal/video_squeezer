import { Component, OnInit } from '@angular/core';
import { sendWsMsg } from '../../utils/sharedSocket'
import { msgUtils, http, cryptoUtils } from '../../utils/cf'
import _ from 'lodash'

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {

    constructor() { }

    ngOnInit(): void { }
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


    //_.range(17, 28).map(n => ({
    //     value: n,
    //     label: `${n}`
    // }))

    jobOptions = {
        size: '720',
        crf: '23'
    }


    async handleFileSelect(event) {
        console.log(this.jobOptions);

        let file = event.target.files[0];
        if (!file) {
            return;
        }
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
        })

        if (!res.result) {
            msgUtils.alert(res.error || 'error', { details: res.details })
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
        })

        if (!res.result) {
            msgUtils.alert(res.error || 'error', { details: res.details })
            this.uploadStatusText = '';
            this.fileUploadingNow = false
            return
        } else {
            msgUtils.alert('done', { details: res.result })
        }

        // await http.putFileUsingPresignedUrl(url, file)

        this.uploadStatusText = '';
        this.fileUploadingNow = false
    }

}
