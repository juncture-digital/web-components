<template>

<div ref="root" :style="{width: '100%', height: '100%'}">
  <div class="content">
    <div id="lat-lng-zoom" v-html="latLngZoom" @click="copyTextToClipboard(`${latLngZoom}`)"></div>
    <sl-range id="opacity-slider" value="1" min="0" max="1" step="0.01" tooltip="none" :style="{display: tileLayers && tileLayers.length > 0 ? 'block' : 'none'}"></sl-range>
    <div id="map"></div>
    <div v-if="caption" id="caption" v-html="caption"></div>
  </div>
</div>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue'
  import L, { LatLng, TileLayer } from 'leaflet'
  import { isQID, getEntity, getManifest, metadataAsObj, isMobile, makeSticky } from '../utils'
  import '@shoelace-style/shoelace/dist/components/range/range.js'
  import type SLRange from '@shoelace-style/shoelace/dist/components/range/range.js'
import { mapToStyles } from '@popperjs/core/lib/modifiers/computeStyles'

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
    zoom: { type: Number, default: 2 },
    center: { type: String, default: '55.4,6.7' },
    marker: { type: String },
    caption: { type: String },
    width: { type: String },
    height: { type: String },
    sticky: { type: Boolean },
    full: { type: Boolean },
    left: { type: Boolean },
    right: { type: Boolean },
    entities: { type: String },
    preferGeojson: { type: Boolean },
    cards: { type: String },
    base: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  // const host = computed(() => (root.value?.getRootNode() as any)?.host as HTMLElement)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  const shadowRoot = computed(() => root?.value?.parentNode)
  const content = computed(() => shadowRoot.value?.querySelector('.content') as HTMLElement)

  const map = ref<L.Map>() 
  const opacitySlider = ref<SLRange>() 
  const entities = ref<any[]>([])
  const latLngZoom = ref<String>()
  const layerObjs = ref<any[]>([])
  
  const tileLayers = ref<L.TileLayer[]>()
  const geoJsonLayers = ref<L.LayerGroup[]>()

  const zoom = ref(10) 
  const priorLoc = ref<string>()

  const initialized = ref(false) 
  const zoomed = ref()

  const flyto = ref()

  watch(host, () => nextTick(() => doLayout()))

  onMounted(() => {
    evalProps()
    doLayout()
  })

  const position:string = isMobile() ? 'full' : (props.right ? 'right' : props.left ? 'left' : 'full')

  function doLayout() {
    host.value.classList.add('ve-component')
    host.value.classList.add(position)
    if (position === 'full') {
      host.value.style.width = '100%'
    } else {
      host.value.style.float = position
      host.value.style.width = 'calc(50% - 16px)'
    }
    host.value.style.width = window.getComputedStyle(host.value).width

    if (props.sticky) makeSticky(host.value)

    content.value.style.width = props.width || '100%'
    nextTick(() => {
      let width = parseInt(window.getComputedStyle(content.value).width.slice(0,-2))
      let height = width
      if (props.sticky && position === 'full') {
        let maxStickyHeight = Math.round(window.innerHeight * .4)
        height = Math.min(maxStickyHeight, width)
      } 
      // console.log(`width=${width} height=${height}`)
      content.value.style.width = `${width}px`
      content.value.style.height = `${height}px`
      init()
    })
  }

  watch(props, () => evalProps())

  function evalProps() {
    zoom.value = props.zoom 
    if (props.cards) parseCards()
  }

  function parseCards() {
    let cardLocations: any[] = []
    if (props.cards) {
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
            cardLocations.push({coords: latLng(coords), caption: card.innerHTML})
          }
        })
      }
    }
    if (cardLocations.length > 0) layerObjs.value = [...layerObjs.value, ...cardLocations]
  }

  watch(layerObjs, async () => {
    let _layerObjs = await Promise.all(layerObjs.value)
    console.log(_layerObjs)
    let locations = _layerObjs.filter(item => item.coords || item.qid)

    let geojsonUrls = _layerObjs
      .filter(layer => props.preferGeojson && layer.geojson)
      .map (layer => {
        if (layer.geojson.indexOf('http') === -1) layer.geojson = `https://raw.githubusercontent.com/${props.base}/${layer.geojson}`
        return layer
      })
      .map(layer => fetch(layer.geojson))

    let responses = await Promise.all(geojsonUrls)
    let geoJSONs = await Promise.all(responses.map((resp:any) => resp.json()))

    let _geoJsonLayers = geoJSONs.map(geoJSON => L.geoJSON(geoJSON))

    if (locations.length > 0) _geoJsonLayers.push(toGeoJSON(locations))
    geoJsonLayers.value = _geoJsonLayers
    
    tileLayers.value = _layerObjs.filter(ls => ls.allmaps).map(ls =>  
      L.tileLayer(`https://allmaps.xyz/maps/${ls.allmaps}/{z}/{x}/{y}.png`, {
        maxZoom: 19, 
        attribution: 'Allmaps'
      }))
  })

  watch(tileLayers, () => updateMap())
  watch(geoJsonLayers, () => updateMap())
  watch(map, () => updateMap())

  function init() {
    if (initialized.value) return
    initialized.value = true
    addOpacitySlider()

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
      // layerObjs.value = locations
      layerObjs.value = [...layerObjs.value, ...locations]
    }
    getLayerStrings()
    listenForSlotChanges()

    const resizeObserver = new ResizeObserver(() => initMap())
    let mapEl = shadowRoot.value?.querySelector('#map')
    if (mapEl) resizeObserver.observe(mapEl)
    initMap()
    addInteractionHandlers()
  }

  function addOpacitySlider() {
    if (!opacitySlider.value) {
      opacitySlider.value = shadowRoot.value?.querySelector('sl-range') as SLRange
      opacitySlider.value.addEventListener('sl-input', (evt) => {
        evt.stopPropagation()
        evt.preventDefault()
        let _map: L.Map = map.value as L.Map
        _map.eachLayer((layer:any) => {
          if (layer.options.attribution === 'Allmaps') {
            // console.log(opacitySlider.value?.value)
            layer.setOpacity(opacitySlider.value?.value)
          }
        })
      })
    }
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
      zoom.value = 9
    } else {
      center = new L.LatLng(0, 0)
      zoom.value = 6
    }

    if (map.value) {
      map.value.off()
      map.value.remove()
      let mapEl = shadowRoot.value?.querySelector('#map') as HTMLElement
      let newMapEl = document.createElement('div')
      newMapEl.id = 'map'
      mapEl.replaceWith(newMapEl)
    }
    let mapEl = shadowRoot.value?.querySelector('#map') as HTMLElement
    if (mapEl) {
      map.value = L.map(mapEl, {
      preferCanvas: false,
      zoomSnap: 0.1,
      center, 
      zoom: zoom.value,
      scrollWheelZoom: false,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '© OpenStreetMap'
        })
      ]
      })
      map.value.on('click', (e) => {
        getLatLngZoom(e)
        gotoPriorLoc()
      })
      map.value.on('zoomend', (e) => {
        getLatLngZoom(e as L.LeafletMouseEvent)
        if (flyto.value) flyto.value.layer.openPopup()
      })
      map.value.on('moveend', (e) => getLatLngZoom(e as L.LeafletMouseEvent))
      latLngZoom.value = `${Number((center.lat).toFixed(5))},${Number((center.lng).toFixed(5))} ${zoom.value}`
      priorLoc.value = `${Number((center.lat).toFixed(5))},${Number((center.lng).toFixed(5))},${zoom.value}`
    }
  }

  function getLatLngZoom(e:L.LeafletMouseEvent) {
    let point = e.type === 'click' ? e.latlng : e.target.getCenter()
    let zoom = e.target.getZoom()
    let resp = [point.lat, point.lng, zoom]
    latLngZoom.value = `${Number((point.lat).toFixed(5))},${Number((point.lng).toFixed(5))} ${zoom}`
    if (!zoomed.value) priorLoc.value = `${Number((point.lat).toFixed(5))},${Number((point.lng).toFixed(5))},${zoom}`
    return resp
  }

  function updateMap() {
    if (map.value) {
      tileLayers.value?.forEach(layer => {
        map.value?.addLayer(layer)
        layer.setOpacity(1)
      })
      geoJsonLayers.value?.forEach(layer => map.value?.addLayer(layer))
    }
  }

  function toGeoJSON(locations:any[]): L.GeoJSON {
    const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
    locations.filter(location => location.coords)
      .forEach(location => {
        let [lat, lng] = location.coords.split(',').map((val:string) => parseFloat(val.trim()))
        data.features.push({
          type: 'Feature',
          properties: location,
          geometry: { type: 'Point', coordinates: [lng, lat] }
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
      onEachFeature: (feature, layer) => {
        let data = JSON.stringify(feature.properties).replace(/"/g, '&quot;')
        let html = `<ve-info-card data="${data}" style="width:100%;"></ve-info-card>`
        layer.bindPopup(html)
        layer.on('mouseover', () => layer.openPopup())
        layer.on('mouseout', () => {
          let layerId = (layer as any).feature.properties.id    
          if (zoomed.value !== layerId) layer.closePopup()
        })
        
        layer.on('click', () => {
          if (zoomed.value) {
            layer.closePopup()
          } else {
            layer.openPopup()
            flytoLocation(feature.properties.id)
          }
        })

      }
    })
    
    return geoJSON
  }
  
  function getLayerStrings() {
    let _layerObjs = Array.from(host.value.querySelectorAll('li')).map((item:any) => toObj(item.firstChild?.textContent))
    if (props.marker) _layerObjs.push(toObj(props.marker))
    // layerObjs.value = _layerObjs
    layerObjs.value = [...layerObjs.value, ..._layerObjs]
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

  function tokenize(s:string) {
    s = s || ''
    let tokens:string[] = []
    s = s.replace(/“/,'"').replace(/”/,'"').replace(/’/,"'")
    let match = s.match(/[^\s"]+|"([^"]*)"/gmi)
    if (match) match.forEach(token => {
      if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
      else tokens.push(token)
    })
    return tokens
  }

  function manifestToInfoObj(manifest:any, id:string) {
    // console.log(manifest)
    let obj:any = {id}
    let metadata = metadataAsObj(manifest)
    if (metadata.location) obj.coords = metadata.location[0]
    if (metadata.coordinates_of_the_point_of_view) obj.coords = metadata.coordinates_of_the_point_of_view[0]
    if (manifest.label) obj.label = manifest.label.en
    if (manifest.summary) obj.description = manifest.summary.en[0]
    if (manifest.thumbnail) obj.image = manifest.thumbnail[0].id
    return obj
  }

  function entityToInfoObj(entity:any, id:string) {
    let obj:any = {id}
    if (entity.coords) obj.coords = entity.coords
    if (entity.geojson) obj.geojson = entity.geojson
    if (entity.label) obj.label = entity.label
    if (entity.description) obj.description = entity.description
    if (entity.thumbnail) obj.image = entity.thumbnail
    return obj
  }

  async function toObj(s:string) {
    let tokens = tokenize(s)
    let geoJsonRegex = /\.(geo)?json$/i
    let iiifRegex = /^[a-z0-9\-]+:.+/
    let obj:any = {}
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i]
      
      if (token.indexOf('=') > 0) {
        let split = token.split('=')
        obj[split[0]] = split[1]
      
      } else if (isZoom(token)) {
        obj.zoom = parseInt(token)
      
      } else if (isCoords(token)) {
        // obj.coords = latLng(token)
        obj.coords = token
        obj.id = token
      
      } else if (isQID(token)) {
        let entity = await getEntity(token)
        obj = {...entityToInfoObj(entity, token), ...obj}
      
      } else if (iiifRegex.test(token)) {
        let manifest = await getManifest(token)
        obj = {...manifestToInfoObj(manifest, token), ...obj}
      
      } else if (geoJsonRegex.test(token)) {
        obj.geojson = token
      
      } else {
        let text = token[0] === '"' && token[token.length-1] === '"' ? token.slice(1,-1) : token
        if (obj.label) obj.description = text
        else obj.label = text
      }
    }
    return obj
  }

  function latLng(coordsStr:string) {
    let [lat, lng] = coordsStr.split(',').map(val => parseFloat(val.trim()))
    return new LatLng(lat, lng)
  }

  function copyTextToClipboard(text: string) {
    if (navigator.clipboard) navigator.clipboard.writeText(text)
  }

  const flytoRegex = RegExp(/^((?<lat>[-?\d.]+),(?<lng>[-?\d.]+)|(?<qid>Q[0-9]+)),?(?<zoom>[\d.]+)?$/)

  function parseFlytoArg(arg:string='') {
    arg = arg.replace(/^flyto\|/i,'')
    let id = ''
    let zoom = 10
    let split = arg.split(',')
    if (split.length === 1) {
      id = split[0]
    } else if (split.length === 2) {
      if (/^[+-]?\d+(.\d*|\d*)$/.test(split[0])) {
        id = split.join(',')
      } else {
        id = split[0]
        zoom = parseFloat(split[1])
      }
    } else {
      id = split.slice(0,2).join(',')
      zoom = parseFloat(split[2])
    }

    let layer:any
    map.value?.eachLayer((_layer:any) => {
      if (_layer?.feature?.properties?.id === id) layer = _layer
    })
    if (!layer) map.value?.eachLayer((_layer:any) => layer = _layer)
    return {id, zoom, layer}
  }

  function addInteractionHandlers() {
    Array.from(host.value.parentElement.querySelectorAll('[enter],[exit]') as HTMLElement[]).forEach(el => {
      let veMap = findVeMap(el)
      if (veMap) addMutationObserver(el)
    })

    let el = host.value.parentElement
    while (el?.parentElement && el.tagName !== 'BODY') el = el.parentElement;
  
    if (el) {
      (Array.from(el.querySelectorAll('mark')) as HTMLElement[]).forEach(mark => {
        let match = Array.from(mark.attributes).find(attr => attr.name === 'flyto')
        if (match) {
          let veMap = findVeMap(mark.parentElement)
          if (veMap) {
            let flytoArg = match?.value
            mark.classList.add(match.name)
            mark.addEventListener('click', () => flytoLocation(flytoArg))
            mark.addEventListener('mouseover', () => {
              let layer = parseFlytoArg(flytoArg).layer
              layer.openPopup()
              if (isMobile()) setTimeout(() => layer.closePopup(), 2000)
            })
            mark.addEventListener('mouseleave', () => {
              flyto.value = parseFlytoArg(flytoArg)
              if (flyto.value.id !== zoomed.value) flyto.value.layer?.closePopup()
            })          
          }
        }
      })
    }
  }

  function addMutationObserver(el: HTMLElement) {
    let prevClassState = el.classList.contains('active')
    let observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName == 'class') {
          let currentClassState = (mutation.target as HTMLElement).classList.contains('active')
          if (prevClassState !== currentClassState) {
            prevClassState = currentClassState
            let attr = el.attributes.getNamedItem(currentClassState ? 'enter' : 'exit')
            if (attr) {
              const [action, ...rest] = attr.value.split(':')
              // console.log(`action=${action} arg=${rest.join(':')}`)
              if (action === 'flyto') flytoLocation(rest.join(':'), true)
              if (attr.name === 'exit') gotoPriorLoc()
            }
          }
        }
      })
    })
    // observer.observe(el, {attributes: true})
    observer.observe(el, { attributes: true, childList: true, subtree: true, characterData: true })

  }

  function findVeMap(el: any) {
    let sib = el.previousSibling
    while (sib) {
      if (sib.nodeName === 'VE-MAP') return sib === host.value ? sib : null
      sib = sib.previousSibling
    }
    while (el.parentElement && el.tagName !== 'MAIN') {
      el = el.parentElement
      let veMap = el.querySelector(':scope > ve-map, :scope > p > ve-map')
      if (veMap) return veMap === host.value ? veMap : null
    }
  }

  async function flytoLocation(arg: string, force=false) {
    flyto.value = parseFlytoArg(arg)
    if (flyto.value.layer) {
      if (flyto.value.id === zoomed.value && !force) {
        flyto.value.layer.closePopup()
        gotoPriorLoc()
      } else {
        zoomed.value = flyto.value.id
        let center = latLng(flyto.value.layer.feature.properties.coords)
        map.value?.flyTo(center, flyto.value.zoom)
      }
    } else {
      gotoPriorLoc()
    }
  }

  function gotoPriorLoc() {
    flyto.value = null
    if (priorLoc.value) {
      let [lat, lng, zoom] = priorLoc.value.split(',').map(val => parseFloat(val))
      let center = new L.LatLng(lat, lng)
      map.value?.flyTo(center, zoom)
      map.value?.closePopup()
    }
    zoomed.value = undefined
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
    margin-bottom: 1rem;
  }

  .content {
    margin: auto;
    /* box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px; */
  }

  #map {
    border: 1px solid #ccc;
    width: 100%;
    height: 100%;
  }
  
  #caption {
    display: flex;
    align-items: center;
    font-family: sans-serif;
    width: 100%;
    /* background: rgba(0, 0, 0, 0.7); */
    background-color: #555;
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
    padding: 3px 6px;
    border-radius: 6px;
  }

  #opacity-slider:hover {
    /* background-color: rgba(255, 255, 255, 0.8); */

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
  
  .leaflet-popup-content {
    width: 280px;
    margin: 0;
  }

</style>