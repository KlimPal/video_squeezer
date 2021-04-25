import { Component, OnInit } from '@angular/core';
import { appState } from './globalConfig'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { sendWsMsg } from './utils/sharedSocket'
import { SwUpdate } from '@angular/service-worker'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    title = 'front';
    showFooterMenu = true;

    constructor(
        private router: Router,
        private swUpdate: SwUpdate
    ) {
        function initCssVariableVh() {
            let vh = window.innerHeight * 0.01 + '';
            document.documentElement.style.setProperty('--vh', ''.concat(vh, 'px'));

        }

        function initFocusStylingHelper() {
            document.body.addEventListener('mousedown', function () {
                document.body.classList.add('using-mouse');
            });
            document.body.addEventListener('keydown', function (event) {
                if (event.keyCode === 9) {
                    document.body.classList.remove('using-mouse');
                }
            });
        }

        initCssVariableVh();
        initFocusStylingHelper()
        window.addEventListener('resize', initCssVariableVh);

        this.swUpdate.available.subscribe(event => {
            if (confirm('Update Available. Refresh the page now to update the cache.')) {
                location.reload();
            } else {
                console.log('continue with the older version');
            }
        });

        setInterval(() => {
            this.swUpdate.checkForUpdate();
        }, 30000);

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

    ngOnInit() {
        this.router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                let url = val.url.split('?')[0]
                if (['/login', '/', '/authentication/google/callback'].includes(url)) {
                    this.showFooterMenu = false
                } else {
                    this.showFooterMenu = true
                }
            }

        });
    }

}
