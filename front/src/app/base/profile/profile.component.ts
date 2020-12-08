import { Component, OnInit } from '@angular/core';
import { sendWsMsg } from '../../utils/sharedSocket'
import { msgUtils, http } from '../../utils/cf'
import { Router, ActivatedRoute } from '@angular/router';
import { appState, nodeRootAddress } from '../../globalConfig'
import { getResizedUrlOfImg } from '../../utils/imgproxy'

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

    constructor(private router: Router) { }

    ngOnInit(): void {
        this.initProfile()
    }

    profile = {
        photoUrl: '',
        userName: '',
        settings: {
            enablePushNotification: false,
        }
    }

    photoUrlUploadingNow = false
    isSaveButtonShow = false
    async initProfile() {
        this.profile = appState.cache.profile
        this.loadProfile()
    }

    async loadProfile() {
        let data = await sendWsMsg('user.get', { userId: appState.user.userId })
        if (data.result) {
            if (data.result.photoUrl.indexOf('http') !== 0) {
                data.result.photoUrl = nodeRootAddress + '/' + data.result.photoUrl
            }
            data.result.photoUrl = getResizedUrlOfImg(data.result.photoUrl, { width: 200 })
            this.profile = { ...this.profile, ...data.result }
            appState.cache.profile = this.profile
        } else {
            msgUtils.alert(data.error || 'error while loading profile')
        }

    }

    showSaveButton() {
        this.isSaveButtonShow = true
    }

    async undo() {
        this.initProfile()
        this.isSaveButtonShow = false
    }

    async save() {
        let data = await sendWsMsg('user.updateProfileInfo', {
            userName: this.profile.userName,
            settings: this.profile.settings,
        })
        if (data.result == 'ok') {
            this.isSaveButtonShow = false
        } else {
            msgUtils.alert(data.error || 'error', { details: data.details })
        }
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
        let file = event.target.files[0];
        if (!file) {
            return;
        }

        this.photoUrlUploadingNow = true



        let res = await sendWsMsg('files.getPresignedPutObjectUrl')
        if (!res.result) {
            msgUtils.alert(res.error || 'error', { details: res.details })
            return
        }
        let { url, fileId } = res.result

        await http.putFileUsingPresignedUrl(url, file)

        res = await sendWsMsg('user.updateProfilePhoto', { fileId })
        if (res.result == 'ok') {
            this.loadProfile()
        } else {
            msgUtils.alert(res.error || 'error')
        }
        this.photoUrlUploadingNow = false
    }

}
