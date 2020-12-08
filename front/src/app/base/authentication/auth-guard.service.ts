import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';
import { appState } from '../../globalConfig'
import { msgUtils } from '../../utils/cf'
import { sendWsMsg, socketOnOpen } from '../../utils/sharedSocket'


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    async canActivate(activatedRouteSnapshot, routerStateSnapshot) {
        let url = routerStateSnapshot.url.split('?')[0]
        appState.user.token = localStorage.getItem('token')
        if (['/', '/login'].includes(url)) {
            let token = activatedRouteSnapshot.queryParams.token || appState.user.token
            if (!token && url == '/') {
                this.router.navigateByUrl('/login')
                return false
            }
            if (token) {
                let data = await sendWsMsg('authentication.checkSession', { token: token, getUserInfo: true })
                if (data.result) {
                    localStorage.setItem('token', token)
                    localStorage.setItem('userId', data.result.userId)
                    appState.user.token = token
                    appState.user.userId = data.result.userId
                    this.router.navigateByUrl('/map')
                    return false
                } else {
                    msgUtils.alert(data.error || 'error')
                    return true
                }
            } else {
                return true
            }
        }
        if (url == '/authentication/google/callback') {
            let authCode = activatedRouteSnapshot.queryParams.code
            if (!authCode) {
                msgUtils.alert('invalid code in URL')
                return
            }
            let data = await sendWsMsg('authentication.getToken', { googleAuthCode: authCode })
            if (data.result) {
                this.router.navigateByUrl(`/?token=${data.result}`)
            } else {
                msgUtils.alert(data.error || 'error')
            }
            return true;
        }

        if (!appState.user.token) {
            this.router.navigateByUrl('/login')
            return false
        }

        return true;

    }
    constructor(private router: Router) {
        let func = () => {
            appState.user.token = localStorage.getItem('token')
            appState.user.userId = localStorage.getItem('userId')
            if (appState.user.token) {
                sendWsMsg('authentication.checkSession', { token: appState.user.token }).then((data) => {
                    if (data.result == 'error') {
                        appState.user.token = ''
                        appState.user.userId = ''
                        localStorage.setItem('token', '')
                        this.router.navigateByUrl('/login')
                    }
                })
            }
             sendWsMsg('getApiRules').then((data) => {
                 console.log(data);
             })
            sendWsMsg('user.getClientConfig').then((data) => {
                if (!data.result) {
                    return
                }
                appState.clientConfig = { ...appState.clientConfig, ...data.result }
            })
        }
        func()
        socketOnOpen.subscribe(() => {
            func()
        })

    }
}
