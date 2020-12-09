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
        this.uploadStatusText = 'calculating md5...'
        let hash = await cryptoUtils.mMd5HashOfFile(file)
        let res = await sendWsMsg('files.getPartialUpload', {
            fileHash: hash,
            fileSize: file.size,
        })
        if (!res.result) {
            msgUtils.alert(res.error || 'error', { details: res.details })
            return
        }

         let { uploadParts, fileId } = res.result
         console.log(uploadParts);

        // await http.putFileUsingPresignedUrl(url, file)

        this.uploadStatusText='';
        this.fileUploadingNow = false
    }

}
