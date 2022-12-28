<template>

<div ref="root" class="content">
  <div id="lat-lng-zoom" v-html="latLngZoom" @click="copyTextToClipboard(`${latLngZoom}`)"></div>
  <input v-if="tileLayers && tileLayers.length > 0" id="opacity-slider" type="range" min="0" max="1" step="0.02" value="1" @nput="updateOpacity"/>
  <div id="map" :style="{width: '100%', height: '100%'}"></div>
  <div v-if="caption" id="caption" v-html="caption"></div>
</div>

</template>
  
<script setup lang="ts">

  import { computed, ref, watch } from 'vue'
  import L, { LatLng } from 'leaflet'
  import { isQID, getEntity, makeSticky } from '../utils'

  const markerIconTemplate = {
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon-2x.png',
    iconSize:    [25, 41],
    iconAnchor:  [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    shadowSize:  [41, 41]
  }

  const props = defineProps({
    overlay: { type: String },
    zoom: { type: Number },
    center: { type: String },
    marker: { type: String },
    caption: { type: String },
    width: { type: String },
    height: { type: String },
    sticky: { type: Boolean },
    full: { type: Boolean },
    left: { type: Boolean },
    right: { type: Boolean },
    entities: { type: String },
    cards: { type: String },
    base: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  const map = ref<L.Map>() 
  const opacitySlider = ref<HTMLInputElement | null>() 
  const entities = ref<any[]>([])
  const latLngZoom = ref<String>()
  const layerObjs = ref<any[]>([])
  const tileLayers = ref<L.TileLayer[]>()
  const geoJsonLayers = ref<L.LayerGroup[]>()

  let zoom:number = 10

  watch(host, () => init())

  watch(layerObjs, async () => {

    let _layerObjs = await Promise.all(layerObjs.value)
    let layers: any = {}
    let locations = _layerObjs.filter(item => item.coords || item.qid)

    let responses = await Promise.all(_layerObjs
      .filter(layer => layer.geojson)
      .map (layer => {
        if (layer.geojson.indexOf('http') === -1) layer.geojson = `https://raw.githubusercontent.com/${props.base}/${layer.geojson}`
        return layer
      })
      .map(layer => fetch(layer.geojson)))

    let geoJSONs = await Promise.all(responses.map((resp:any) => resp.json()))
    let _geoJsonLayers = geoJSONs.map(geoJSON => L.geoJSON(geoJSON))

    if (locations.length > 0) _geoJsonLayers.push(toGeoJSON(locations))
    layers.geoJsonLayers = _geoJsonLayers
    
    layers.tileLayers = _layerObjs.map(ls => {
      if (ls.allmaps) {
        return L.tileLayer(`https://allmaps.xyz/maps/${ls.allmaps}/{z}/{x}/{y}.png`, { maxZoom: 19, attribution: 'Allmaps' })
      }
    }).filter(layer => layer)

    layers.value = layers

  })

  watch(tileLayers, () => updateMap())
  watch(geoJsonLayers, () => updateMap())
  watch(map, () => updateMap())

  function init() {
    host.value.classList.add('ve-component')
    entities.value = props.entities ? props.entities.split(/\s+/).filter(qid => qid) : []
    if (props.cards) {
      let locations: any[] = []
      let cardsEl = document.getElementById(props.cards)
      if (cardsEl) {
        cardsEl.querySelectorAll('.card').forEach(async card => {
          let coords:string = Array.from(card.querySelectorAll('li'))
            .filter(li => li.innerHTML.trim().indexOf('coords:') === 0)
            .map(coordsEl => coordsEl.innerHTML.split(':')[1].trim())
            .pop() || ''
          if (coords) {
            let metadataUl = card.querySelector('ul.card-metadata')
            if (metadataUl) metadataUl.parentElement?.removeChild(metadataUl)
            locations.push({coords: latLng(coords), caption: card.innerHTML})
          }
        })
      }
      layerObjs.value = locations
    }
    getLayerStrings()
    listenForSlotChanges()

    doLayout()
    if (props.sticky) makeSticky(host.value)
    const resizeObserver = new ResizeObserver(() => initMap())
    let mapEl = shadowRoot.value?.querySelector('#map')
    if (mapEl) resizeObserver.observe(mapEl)
    initMap()
  }

  async function initMap() {
    let center: L.LatLng
    if (props.center) {
      if (isQID(props.center)) {
        let entity = await getEntity(props.center)
        center = latLng(entity.coords)
      } else {
        center = latLng(props.center)
      }
    } else if (props.entities) {
      let entity = await getEntity(entities.value[0])
      center = latLng(entity.coords)
      zoom = 9
    } else {
      center = new L.LatLng(0, 0)
      zoom = 6
    }

    if (map.value) {
      map.value.off()
      map.value.remove()
    }
    let mapEl = shadowRoot.value?.querySelector('#map') as HTMLElement
    if (mapEl) {
      map.value = L.map(mapEl, {
      preferCanvas: true,
      zoomSnap: 0.1,
      center, 
      zoom,
      scrollWheelZoom: false,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '© OpenStreetMap'
        })
      ]
      })
      map.value.on('click', (e) => getLatLngZoom(e))
      map.value.on('zoomend', (e) => getLatLngZoom(e as L.LeafletMouseEvent))
      map.value.on('moveend', (e) => getLatLngZoom(e as L.LeafletMouseEvent))
      latLngZoom.value = `${Number((center.lat).toFixed(5))},${Number((center.lng).toFixed(5))} ${zoom}`
    }
  }

  function getLatLngZoom(e:L.LeafletMouseEvent) {
    let point = e.type === 'click' ? e.latlng : e.target.getCenter()
    let zoom = e.target.getZoom()
    let resp = [point.lat, point.lng, zoom]
    latLngZoom.value = `${Number((point.lat).toFixed(5))},${Number((point.lng).toFixed(5))} ${zoom}`
    return resp
  }

  function updateMap() {
    if (map.value) {
      tileLayers.value?.forEach(layer => map.value?.addLayer(layer))
      geoJsonLayers.value?.forEach(layer => map.value?.addLayer(layer))
      if (tileLayers.value) opacitySlider.value = tileLayers.value.length > 0 ? shadowRoot.value?.querySelector('#opacity-slider') as HTMLInputElement : null
    }
  }

  function toGeoJSON(locations:any[]): L.GeoJSON {
    const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
    locations.filter(location => location.coords)
      .forEach(location => {
        data.features.push({
          type: 'Feature',
          properties: location,
          geometry: { type: 'Point', coordinates: [location.coords.lng, location.coords.lat] }
        })
      })

  
    const geoJSON = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        let iconOptions:any = {...markerIconTemplate}
        if (feature.properties.icon) iconOptions.iconUrl = feature.properties.icon
        if (feature.properties.shadowUrl)  iconOptions.shadowUrl = feature.properties.shadowUrl
        if (feature.properties.iconRetinaUrl)  iconOptions.iconRetinaUrl = feature.properties.iconRetinaUrl
        return L.marker(latlng, { icon: new L.Icon(iconOptions) })
      },
      onEachFeature: (feature, layer) => layer.bindPopup(feature.properties.caption)
    })
    
    return geoJSON
  }
  
  function getLayerStrings() {
    let _layerObjs = Array.from(host.value.querySelectorAll('li')).map((item:any) => toObj(item.firstChild.textContent))
    if (props.marker) _layerObjs.push(toObj(props.marker))
    layerObjs.value = _layerObjs
  }

  function listenForSlotChanges() {
    const callback = (mutationsList:any) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList' && Array.from(mutation.target.classList).indexOf('hydrated') >= 0) {
          getLayerStrings ()       
        }
      }
    }
    const observer = new MutationObserver(callback);
    observer.observe(host.value, { childList: true, subtree: true, characterData: true })
  }

  function isCoords(str:string) {
    return /^[+-]?\d+(.\d*|\d*),{1}[+-]?\d+(.\d*|\d*)$/.test(str)
  }

  function isZoom(str:string) {
    return /^\d{1,2}(\.\d{1})?$/.test(str)
  }

  function isInt(str:string) {
    return /^[0-9]+$/.test(str)
  }

  async function toObj(s:string) {
    let geoJsonRegex = /\.(geo)?json$/i
    let tokens:string[] = []

    s = s.replace(/“/,'"').replace(/”/,'"').replace(/’/,"'")
    let match = s.match(/[^\s"]+|"([^"]*)"/gmi)
    if (match) match.forEach(token => {
      if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
      else tokens.push(token)
    })
    let obj:any = {}
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i]
      if (token.indexOf('=') > 0) {
        let split = token.split('=')
        obj[split[0]] = split[1]
      } else if (isZoom(token)) {
        obj.zoom = parseInt(token)
      } else if (isCoords(token)) {
        obj.coords = latLng(token)
      } else if (isQID(token)) {
        obj.qid = token
        let entity = await getEntity(token)
        obj.coords = latLng(entity.coords)
        obj.caption = entity.label
      } else if (geoJsonRegex.test(token)) {
        obj.geojson = token
      } else {
        obj.caption = token[0] === '"' && token[token.length-1] === '"' ? token.slice(1,-1) : token
      }
    }
    return obj
  }

  function latLng(coordsStr:string) {
    let [lat, lng] = coordsStr.split(',').map(val => parseFloat(val.trim()))
    return new LatLng(lat, lng)
  }

  function doLayout() {
    let position = props.right ? 'right' : props.left ? 'left' : 'full'

    console.log(`ve-map: width=${props.width} height=${props.height} position=${position} sticky=${props.sticky}`)
    
    const floatMargin = 12

    let width, height
    if (position === 'full') { // Full-width layout
      host.value.classList.add('full')
      host.value.style.width = props.width || '100%'
      let elWidth = parseInt(window.getComputedStyle(host.value).width.slice(0,-2))
      // console.log(`elWidth=${elWidth}`)
      if (props.sticky) {
        let maxHeight = Math.round(window.innerHeight * .4)
        // console.log(`maxHeight=${maxHeight}`)
        width = elWidth
        height = width > maxHeight ? maxHeight : width
      } else {
        width = parseInt(window.getComputedStyle(host.value).width.slice(0,-2))
        height = width
      }     
      host.value.style.width = '100%'

    } else { // Half-width layout
      host.value.style.float = position
      host.value.classList.add(position)
      host.value.style.width = props.width || '50%'
      width = parseInt(window.getComputedStyle(host.value).width.slice(0,-2))
      height = width
    }
    host.value.style.height = `${height + 12}px`

    if (props.sticky) host.value.style.paddingTop = '6px'
    
    let content: HTMLElement = host.value.shadowRoot.querySelector('.content')
    if (position === 'left') content.style.marginRight = `${floatMargin}px`
    else if (position === 'right') content.style.marginLeft = `${floatMargin}px`
    content.style.width = `${width}px`
    content.style.height = `${height}px`
  }

  function copyTextToClipboard(text: string) {
    console.log(`copyTextToClipboard=${text}`)
    if (navigator.clipboard) navigator.clipboard.writeText(text)
  }

  function updateOpacity() {
    if (tileLayers.value && opacitySlider.value) tileLayers.value[0].setOpacity(parseFloat(opacitySlider.value.value))
  }

</script>

<style>

  @import 'leaflet/dist/leaflet.css';

  * { box-sizing: border-box; }

  :host {
    display: flex;
    align-content: center;
    justify-content: center;
    position: relative;
    font-family: Roboto, sans-serif;
    background-color: white;
  }

  .content {
    display: flex;
    flex-direction: column;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
  }

  #map {
    border: 1px solid #ccc;
  }
  #caption {
    display: flex;
    align-items: center;
    font-family: sans-serif;
    width: 100%;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 6px;
    bottom: 0;
    height: 32px;
  }

  #opacity-slider {
    position: absolute;
    bottom: 15px;
    left: 15px;
    width: 33%;
    z-index: 1000;
  }

  #lat-lng-zoom {
    position: absolute;
    font-family: sans-serif;
    bottom: 24px;
    right: 0;
    width: 150px;
    height: 32px;
    padding: 3px 6px;
    font-size: 0.8rem;
    background-color: rgba(255, 255, 255, 0.5);
    color: black;
    z-index: 2;
    opacity: 0;
    text-align: right;
    }
    #lat-lng-zoom:hover {
    visibility: visible;
    opacity: 1;
    transition: all 0.3s ease-in;
    cursor: copy;
    z-index: 1000;
    }

  .card {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto 1fr 0px;
    border-radius: 4px;
    padding: 0;
    }
    
    .card p {
    border: none;
    }
    
    .card-image {  /* image */
    grid-area: 1 / 1 / 2 / 2;
    width: 100%;
    height: 190px;
    }
    
    .card-title {  /* title */
    grid-area: 2 / 1 / 3 / 2;
    font-weight: bold;
    font-size: 1.5rem;
    line-height: 1;
    padding: 1.3rem .5rem .2rem .5rem;
    text-decoration: none;
    }
    
    .card-metadata {  /* metadata list */
    grid-area: 3 / 1 / 4 / 2;
    list-style: none;
    padding: .2rem .5rem;
    margin: 0;
    font-size: 0.9rem;
    font-weight: 400;
    }
    
    .card-abstract{  /* abstract */
    grid-area: 4 / 1 / 5 / 2;
    align-self: flex-end;
    height: 110px;
    line-height: 1.4;
    font-size: 1rem;
    padding: .5rem .5rem 0 .5rem;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    margin: 0 0 .5rem 0;
  }
  
</style>