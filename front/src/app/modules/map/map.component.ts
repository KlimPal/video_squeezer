import { Component, OnInit, OnDestroy } from '@angular/core';
import * as mapboxgl from 'mapbox-gl/dist/mapbox-gl'
import { msgUtils, cf } from '../../utils/cf'
import { currentLocation, locationChanged } from './location'
import { MatDialog } from '@angular/material/dialog';
import { CreateIncidentComponent } from './create-incident/create-incident.component'
import { IncidentViewComponent } from './incident-view/incident-view.component'
import { sendWsMsg } from '../../utils/sharedSocket'
import { PushNotificationService } from '../../services/push-notification.service'
import { Router, ActivatedRoute } from '@angular/router'
import { EventsService } from '../../services/events.service'


let cachedMap = {
    map: null,
    container: null,
    incidentStorage: null,
}
let mapUpdateSubscription = null

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit, OnDestroy {

    constructor(public dialog: MatDialog,
        private pushService: PushNotificationService,
        private activatedRoute: ActivatedRoute,
        private eventsService: EventsService,
    ) {

    }

    map = null;
    isCenterIsCurrentLocation = false;
    intervals = []
    subscriptions = []

    ngOnInit() {

        this.initMarkerImageList()

        if (!mapUpdateSubscription) {
            mapUpdateSubscription = this.eventsService.events.map_update.subscribe((data) => {
                console.log('map updated');
                if (data.type == 'add' && data.incidentId) {
                    this.loadIncidents({ incidentId: data.incidentId })
                }
                if (data.type == 'remove' && data.incidentId) {
                    this.removeIncidentFromMap(data.incidentId)
                }
            })
        }

        if (cachedMap.incidentStorage) {
            console.log(cachedMap.incidentStorage);
            this.incidentStorage = cachedMap.incidentStorage
        } else {
            cachedMap.incidentStorage = this.incidentStorage
        }
        if (cachedMap.map) {
            cf.qs('.beforeMap').after(cachedMap.container)
            this.map = cachedMap.map
            this.map.on('move', () => {
                this.isCenterIsCurrentLocation = false;
            })
        } else {
            setTimeout(() => {
                this.initMap()
            }, 0)
        }
        if (this.map) {
            this.navigateToIncidentInUrl()
        } else {
            // to do: wait for map init
            setTimeout(() => {
                this.navigateToIncidentInUrl()
            }, 1000)
        }

        window.dispatchEvent(new Event('resize'));

        this.intervals.push(setInterval(() => {
            this.clearExpiredIncidents()
        }, 1000))
        //this.pushService.subscribeToNotifications()
    }

    async navigateToIncidentInUrl() {
        let urlParams = this.activatedRoute.snapshot.queryParams
        if (urlParams.incidentToOpen) {
            let data = await sendWsMsg('incident.get', { incidentId: urlParams.incidentToOpen, allowOutdated: true })
            if (data.result && data.result[0]) {
                let incident = data.result[0]
                let source = this.map.getSource(incident.incidentId)
                if (!source) {
                    await this.loadIncidents({ incidentId: incident.incidentId, allowOutdated: true })
                }
                this.map.jumpTo({
                    center: [incident.longitude, incident.latitude],
                    zoom: 17,
                })

                let dialogRef = this.dialog.open(IncidentViewComponent, {
                    width: 'auto',
                    minWidth: '320px',
                    maxWidth: '100vw',
                    height: 'auto',
                    hasBackdrop: true,
                    panelClass: 'clearDialog',
                    disableClose: false,
                    data: {
                        incident: incident,
                    }
                });
                dialogRef.afterClosed().subscribe(data => {
                    if (data && data.deleteIncident) {
                        this.removeIncidentFromMap(incident.incidentId)
                    }
                })

            } else {
                msgUtils.alert(data.error || 'error')
            }

        }
    }

    initMap() {
        mapboxgl.accessToken = 'pk.eyJ1Ijoia2xpbXBhbCIsImEiOiJjazg0bHhvYTUwMTg0M21vZW9sYmZoMzcwIn0.gBDnLCl6xAw5ehkZX1ILXA';
        let container = document.createElement("div")
        container.style.position = 'absolute'
        container.style.height = '100%'
        container.style.width = '100%'
        cf.qs('.beforeMap').after(container)
        cachedMap.container = container
        this.map = new mapboxgl.Map({
            container: container,
            style: 'mapbox://styles/mapbox/streets-v11?optimize=true',
            zoom: 15,
            center: [currentLocation.longitude, currentLocation.latitude],
            antialias: true
        });
        this.map.on('load', () => {
            this.mapOnLoad(this.map)
        })
        this.map.on('move', () => {
            this.isCenterIsCurrentLocation = false;
        })

        this.map.on('mouseenter', 'markers', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'markers', () => {
            this.map.getCanvas().style.cursor = '';
        });

        let img = new Image(80, 80)
        img.onload = () => this.map.addImage('incident-marker-regular', img, { pixelRatio: 2 })
        img.src = '/assets/icons/map/marker_2.svg'

        let size = 200;
        let currentPositionImg = {
            width: size,
            height: size,
            data: this.markerImageList.currentPosition,
        }
        this.map.addImage('blue-dot', currentPositionImg, { pixelRatio: 2 });

        this.map.on('click', 'markers', (e) => {
            let incident = this.incidentStorage[e.features[0].properties.incidentId]
            let dialogRef = this.dialog.open(IncidentViewComponent, {
                width: 'auto',
                minWidth: '320px',
                maxWidth: '100vw',
                height: 'auto',
                hasBackdrop: true,
                panelClass: 'clearDialog',
                disableClose: false,
                data: {
                    incident: incident,
                }
            });
            dialogRef.afterClosed().subscribe(data => {
                if (data && data.deleteIncident) {
                    this.removeIncidentFromMap(incident.incidentId)
                }
            })

        })

    }

    jumpToCurrentLocation() {
        //console.log(currentLocation);
        this.map.jumpTo({
            center: [currentLocation.longitude, currentLocation.latitude],
            //zoom: 15,
        })
        this.isCenterIsCurrentLocation = true;
    }

    mapOnLoad(map) {
        this.initCurrentLocationMarker(map)
        this.jumpToCurrentLocation()
        cachedMap.map = this.map
        this.loadIncidents({
            near: {
                maxDistance: 100 * 1000,
                longitude: currentLocation.longitude,
                latitude: currentLocation.latitude,
            }
        })
    }

    markerImageList = {
        currentPosition: null
    }

    initMarkerImageList() {
        let initCurrentPositionImg = () => {
            let size = 200;
            let duration = 1000;
            let t = (performance.now() % duration) / duration;
            let radius = (size / 2) * 0.3;
            let outerRadius = size / 8;
            let canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            let context = canvas.getContext('2d');
            context.clearRect(0, 0, size, size);
            context.beginPath();
            context.arc(
                size / 2,
                size / 2,
                outerRadius,
                0,
                Math.PI * 2
            );
            context.fill();
            context.fillStyle = 'hsl(210, 91%, 48%)';
            context.strokeStyle = 'white';
            context.lineWidth = 2 + 4 * (1 - t);
            context.fill();
            context.stroke();
            this.markerImageList.currentPosition = context.getImageData(0, 0, size, size).data;
        }
        initCurrentPositionImg()

    }

    initCurrentLocationMarker(map) {

        map.addSource('points', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': [{
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [0, 0]
                    }
                }]
            }
        });
        map.addLayer({
            'id': 'points',
            'type': 'symbol',
            'source': 'points',
            'layout': {
                'icon-image': 'blue-dot',
                'text-allow-overlap': true,
                'icon-allow-overlap': true
            }
        });

        let updateMarkerPos = (location) => {
            //console.log(location);
            map.getSource('points').setData({
                'type': 'Point',
                'coordinates': [location.longitude, location.latitude]
            });
        }
        updateMarkerPos(currentLocation)

        let firstLocationChange = true;
        locationChanged.subscribe((location) => {
            if (firstLocationChange) {
                firstLocationChange = false;
                this.jumpToCurrentLocation()
            }
            updateMarkerPos(location)
        })

    }
    async addIncident() {
        let dialogRef = this.dialog.open(CreateIncidentComponent, {
            width: 'auto',
            minWidth: '320px',
            maxWidth: '100vw',
            height: 'auto',
            hasBackdrop: true,
            panelClass: 'clearDialog',
            disableClose: true,
            data: {
                //patientId: patientId,
            }
        });
        dialogRef.afterClosed().subscribe((incidentId) => {
            //console.log(incidentId);
            if (incidentId) {
                this.loadIncidents({ incidentId: incidentId })
            }
        })

    }

    removeIncidentFromMap(incidentId) {
        delete this.incidentStorage[incidentId]
        let incidents = Object.values(this.incidentStorage)
        this.map.getSource('markers').setData(this.getMarkerSource(incidents).data)
        this.map.getSource('id2').setData(this.createGeoJsonIncidentAreas(incidents).data)
    }

    clearExpiredIncidents() {
        let dateNow = Date.now()
        for (let incidentId in this.incidentStorage) {
            let incident = this.incidentStorage[incidentId]
            if (dateNow > incident.terminationDate) {
                this.removeIncidentFromMap(incidentId)
            }
        }

    }

    getCoordinatesOfCircle(center, radiusInKm, points = 64) {
        let coords = {
            latitude: center[1],
            longitude: center[0]
        };
        let km = radiusInKm;
        let result = [];
        let distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
        let distanceY = km / 110.574;
        let theta, x, y;
        for (let i = 0; i < points; i++) {
            theta = (i / points) * (2 * Math.PI);
            x = distanceX * Math.cos(theta);
            y = distanceY * Math.sin(theta);

            result.push([coords.longitude + x, coords.latitude + y]);
        }
        result.push(result[0]);
        return result
    }

    createGeoJsonIncidentAreas(incidents) {
        return {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": incidents.map(el => ({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [this.getCoordinatesOfCircle([el.longitude, el.latitude], el.radius / 1000)]
                    },
                    properties: {
                        'incidentId': el.incidentId,
                    }
                }))
            }
        }
    }

    getMarkerSource(incidents) {
        return {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: incidents.map(el => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [el.longitude, el.latitude],
                    },
                    properties: {
                        'name': el.title,
                        'incidentId': el.incidentId,
                    }

                }))
            }
        }
    }

    incidentMarkerStorage = {}
    incidentStorage = {} // {incidentId1: Incident, incidentId2: Incident,}

    async loadIncidents(params = {}) {

        let data = await sendWsMsg('incident.get', params)
        //console.log(data);
        if (!data.result) {
            msgUtils.alert(data.error || 'error', { details: data.details })
            return
        }

        for (let incident of data.result) {
            this.incidentStorage[incident.incidentId] = incident
        }

        let incidents = Object.values(this.incidentStorage)

        let source1 = this.map.getSource('markers')
        if (source1) {
            source1.setData(this.getMarkerSource(incidents).data)
        } else {
            this.map.addSource('markers', this.getMarkerSource(incidents))
            this.map.addLayer({
                'id': 'markers',
                'type': 'symbol',
                'source': 'markers',
                'layout': {
                    'icon-image': 'incident-marker-regular',
                    'icon-anchor': 'bottom',
                    'text-field': '{name}',
                    'text-offset': [0, 0.5],
                    "text-size": {
                        "stops": [
                            [0, 0],
                            [16, 0],
                            [17, 14]
                        ]
                    }

                },
                'paint': {
                    'text-color': 'rgba(20,20,20,1)'
                },
            });
        }

        let source2 = this.map.getSource('id2')
        if (source2) {
            source2.setData(this.createGeoJsonIncidentAreas(incidents).data)
        } else {
            this.map.addSource('id2', this.createGeoJsonIncidentAreas(incidents))
            this.map.addLayer({
                "id": 'id2',
                "type": "fill",
                "source": 'id2',
                "layout": {},

                "paint": {
                    "fill-color": "red",
                    "fill-opacity": 0.05
                }
            });
        }

    }



    ngOnDestroy() {
        this.intervals.forEach(el => clearInterval(el))
    }

}
