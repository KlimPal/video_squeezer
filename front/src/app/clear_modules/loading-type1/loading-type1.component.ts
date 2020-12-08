import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-loading-type1',
    templateUrl: './loading-type1.component.html',
    styleUrls: ['./loading-type1.component.css']
})
export class LoadingType1Component implements OnInit {

    @Input('isLoading') isLoading;
    constructor() {}

    ngOnInit() {

    }

}
