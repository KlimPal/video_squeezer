import { Component, OnInit } from '@angular/core';
import { sendWsMsg } from '../../utils/sharedSocket'
import { msgUtils, http } from '../../utils/cf'

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {

    constructor() {}

    ngOnInit(): void {}
    fileUploadingNow = false;

    async handleFileSelect(event) {
        let file = event.target.files[0];
        if (!file) {
            return;
        }

        this.fileUploadingNow = true

        // let res = await sendWsMsg('files.getPresignedPutObjectUrl')
        // if (!res.result) {
        //     msgUtils.alert(res.error || 'error', { details: res.details })
        //     return
        // }
        // let { url, fileId } = res.result

        // await http.putFileUsingPresignedUrl(url, file)


        this.fileUploadingNow = false
    }

}
