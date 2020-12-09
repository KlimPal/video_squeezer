import { Component, OnInit } from '@angular/core';
import { sendWsMsg } from '../../utils/sharedSocket'
import { msgUtils, http, cryptoUtils } from '../../utils/cf'

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {

    constructor() {}

    ngOnInit(): void {}
    fileUploadingNow = false;
    uploadStatusText = ''

    async handleFileSelect(event) {
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
            hash = await cryptoUtils.mMd5HashOfFile(file, 1024 * 1024 * 5, (progress) => {
                let percents = Math.round(progress * 100);
                this.uploadStatusText = `calculating md5: ${percents}%`
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

        uploadParts = uploadParts.sort((a,b)=>a.rangeStart - b.rangeStart)

        for (let i = 0; i < uploadParts.length; i++) {
            let part = uploadParts[i]
            this.uploadStatusText = `uploading ${i+1}/${uploadParts.length} chunk`
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
