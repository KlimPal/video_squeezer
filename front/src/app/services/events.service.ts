import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core'
import { eventsFromBackend } from '../utils/sharedSocket'

@Injectable({
    providedIn: 'root'
})
export class EventsService {

    constructor() {
        eventsFromBackend.subscribe(({ event, data }) => {
            console.log(event);

            if (!this.events[event]) {
                console.log('unhandled event from backend', { event, data });
                return
            }
            this.events[event].emit(data)
        })
    }

    events = {
        CONVERTING_JOB_STATUS_CHANGED: new EventEmitter(),
    }
}
