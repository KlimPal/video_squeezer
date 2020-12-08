import { EventEmitter } from '@angular/core'
import { sendWsMsg } from '../../utils/sharedSocket'
import { cf } from '../../utils/cf'

export let currentLocation = {
    latitude: 50,
    longitude: 30,
    lastUpdate: 0,
}

export let locationChanged = new EventEmitter()

let watchId = null;
const minDistanceToEmitLocationChange = 5 // in meters

function initLocationUpdate() {
    watchId = navigator.geolocation.watchPosition((pos) => {
        let distanceChange = cf.haversineDistance(currentLocation.longitude, currentLocation.latitude, pos.coords.longitude, pos.coords.latitude)
        //console.log(distanceChange);
        if (distanceChange < minDistanceToEmitLocationChange) {
            return
        }
        currentLocation.latitude = pos.coords.latitude
        currentLocation.longitude = pos.coords.longitude
        currentLocation.lastUpdate = Date.now()
        locationChanged.emit(currentLocation)
    }, (e) => {
        console.log(e);
    }, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
    });
}

locationChanged.subscribe(() => {
    sendSelfLocationToBackend()
})

export function sendSelfLocationToBackend() {
    sendWsMsg('user.updateSelfLocation', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        date: Date.now()
    })
}

initLocationUpdate()
