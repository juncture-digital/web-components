export const iiifServer = 'https://iiif.juncture-digital.org'
import { sha256 as __sha256 } from 'js-sha256'
import md5 from 'js-md5'
import tippy from 'tippy.js';

export function isURL(str:string) { return /^https*:\/\//.test(str) }

export function sha256(str: string) {
  return __sha256(str)
}

export function isMobile() {
  // console.log(`isMobile: ontouchstart=${'ontouchstart' in document.documentElement} mobi=${/mobi/i.test(navigator.userAgent)}`)
  let _isMobile = ('ontouchstart' in document.documentElement && /mobi/i.test(navigator.userAgent) )
  return _isMobile
}

export function isTouchEnabled() {
  return ( 'ontouchstart' in window ) ||
         ( navigator.maxTouchPoints > 0 ) ||
         ( ((navigator as any).msMaxTouchPoints || 0) > 0 )
}

let tippyEntities:any
export function initTippy(el:any=null, force=false) {
  if (force) tippyEntities = null
  el = el || document
  let _entities = Array.from(el.querySelectorAll('mark')).filter(el =>
    Array.from((el as HTMLElement).attributes).find(attr => {
      let attrName = attr.name.toLowerCase()
      return attrName === 'qid' || (isQID(attr.value) && attrName !== 'flyto')
    })
  )
  if (!tippyEntities && _entities.length > 0) {
    tippyEntities = _entities
    // console.log(`initTippy: entities=${tippyEntities.length}`)
    tippy(tippyEntities, {
      // theme: 'light-border',
      interactive: true,
      allowHTML: true,
      delay: [null, null],
      onShow: (instance:any) => {
        let qid = Array.from(instance.reference.attributes)
          .filter((attr:any) => attr.name.toLowerCase() === 'qid' || isQID(attr.value))
          .map((attr:any) => attr.value)
          .flat().join()
        if (qid)
          instance.setContent(`<ve-entity-card qid="${qid}" style="width:600px;max-width:90vw;"></ve-entity-card>`)
      }
    })
  }
}

export async function getManifest(manifestId: string, refresh: boolean=false) {
  let manifestUrl = manifestId.indexOf('http') === 0
    ? manifestId
    : `${iiifServer}/${manifestId}/manifest.json`
  let manifests = await loadManifests([manifestUrl], refresh)
  return manifests[0]
}

export async function prezi2to3(manifest: any) {
  /* Converts IIIF v2 manifest to v3 */
  let resp = await fetch('https://iiif.juncture-digital.org/prezi2to3/', {
    method: 'POST', 
    body: JSON.stringify(manifest)
  })
  if (resp.ok) return (await resp).json()
}

function observeNavbar(navbar:HTMLElement, target:HTMLElement) {
  const setTop = () => {
    let top = parseInt(navbar.style.top.replace(/^-/,'').replace(/px$/,''))
    let height = parseInt(navbar.style.height.replace(/px$/,''))
    let topOffset = height - top
    // if (target.style.top) topOffset += parseInt(target.style.marginTop.slice(0,-2))
    target.style.top = `${topOffset}px`
  }
  setTop()
  const observer = new MutationObserver(setTop)
  observer.observe(navbar, { attributes: true })
}

export function makeSticky(el:HTMLElement) {
  el.classList.add('sticky')
  el.style.position = 'sticky'
  el.style.marginTop = '6px'
  let stickyNavbar:any = document.querySelector('ve-navbar[sticky="true"]') as HTMLElement
  if (stickyNavbar) {
    observeNavbar(stickyNavbar, el)
  } else {
    let header = (document.querySelector('ve-header[sticky]') as HTMLElement)
    if (header) {
      stickyNavbar = header?.shadowRoot?.querySelector('ve-navbar')
      if (stickyNavbar) {
        observeNavbar(stickyNavbar, el)
      } else {
        const observer = new MutationObserver(() => {
          stickyNavbar = header?.shadowRoot?.querySelector('ve-navbar')
          if (stickyNavbar) observeNavbar(stickyNavbar, el)
        })
        observer.observe(header, { childList: true, subtree: true, attributes: true })
      }
    } else {
      el.style.top = '0'
    }
  }
}

export function findItem(toMatch: object, current: object, seq: number = 1): any {
  const found = _findItems(toMatch, current)
  return found.length >= seq ? found[seq-1] : null
}

function _findItems(toMatch: object, current: any, found: object[] = []) {
  found = found || []
  if (current.items) {
    for (let i = 0; i < current.items.length; i++ ) {
      let item = current.items[i]
      let isMatch = !Object.entries(toMatch).find(([attr, val]) => item[attr] && item[attr] !== val)
      if (isMatch) found.push(item)
      else _findItems(toMatch, item, found)
    }
  }
  return found
}

export function getItemInfo(manifest:any, seq=1) {
  // console.log(`itemInfo: seq=${seq}`, manifest)
  let _itemInfo = findItem({type:'Annotation', motivation:'painting'}, manifest, seq).body
  // if (_itemInfo.service) _itemInfo.service = _itemInfo.service.map((svc:any) => ({...svc, ...{id: (svc.id || svc['@id']).replace(/\/info\.json$/,'')}}))
  return _itemInfo
}

export function imageCount(manifest:any) {
  return _findItems({type:'Annotation', motivation:'painting'}, manifest).length
}

const _manifestCache:any = {}
export async function loadManifests(manifestUrls: string[], refresh: boolean=false) {
  let _manifestUrls = manifestUrls
  .map(manifestId =>
    manifestId.indexOf('http') === 0
      ? manifestId
      : `${iiifServer}/${manifestId}/manifest.json`
  )
  let toGet = _manifestUrls.filter(url => !_manifestCache[url])
  // console.log(`loadManifests: toGet=${toGet.length}`)

  if (toGet.length > 0) {
    let requests: any = toGet
      .map(manifestUrl => {
        if (refresh && ['localhost', 'iiif.juncture-digital.org'].includes(new URL(manifestUrl).hostname)) {
          manifestUrl += '?refresh'
        }
        /*
        return fetch(manifestUrl,
          ['localhost', 'iiif.juncture-digital.org'].includes(new URL(manifestUrl).hostname)
            ? {headers: {'X-Requested-From': window.location.href}}
            : {}
        )
        */
        return fetch(manifestUrl)
      })
    let responses = await Promise.all(requests)
    let manifests = await Promise.all(responses.map((resp:any) => resp.json()))
    requests = manifests
      .filter(manifest => !Array.isArray(manifest['@context']) && parseFloat(manifest['@context'].split('/').slice(-2,-1).pop()) < 3)
      .map(manifest => fetch('https://iiif.juncture-digital.org/prezi2to3/', {
        method: 'POST', 
        body: JSON.stringify(manifest)
      }))
    if (requests.length > 0) {
      responses = await Promise.all(requests)
      let convertedManifests = await Promise.all(responses.map((resp:any) => resp.json()))
      for (let i = 0; i < manifests.length; i++) {
        let found = convertedManifests.find(manifest => manifest['@id'] === manifests[i].id)
        if (found) manifests[i] = found
      }
    }
    manifests.forEach((manifest, idx) => _manifestCache[toGet[idx]] = manifest)
    return _manifestUrls.map(url => _manifestCache[url])
  } else {
    return _manifestUrls.map(url => _manifestCache[url])
  }
}

function _value(langObj: any, language='en') {
  return typeof langObj === 'object'
    ? langObj[language] || langObj.none || langObj[Object.keys(langObj).sort()[0]]
    : langObj
}

export function label(manifest:any, language:string = 'en') {
  return manifest ? _value(manifest.label, language) : null
}

export function summary(manifest:any, language:string = 'en') {
  return manifest ? _value(manifest.summary, language) : null
}

export function staticImage(manifest: any, options:any, width:number=0, height:number=0) {
  // console.log('staticImage', manifest, options)
  let _imageInfo = getItemInfo(manifest)
  let region = options.region || 'full'
  let size = options.size
    ? options.size
    : width
      ? height
        ? `${width},${height}`
        : `${width},`
      : height
        ? `,${height}`
        : '400,'
  let rotation = options.rotation || '0'
  let quality = options.quality || 'default'
  let format = options.format || 'jpg'
  let url =`${_imageInfo.service[0].id || _imageInfo.service[0]['@id']}/${region}/${size}/${rotation}/${quality}.${format}`
  // console.log(url)
  return url
}

export function thumbnail(manifest: any, width:number=400) {
  if (!manifest) return null
    let _imageInfo = getItemInfo(manifest)
    return _imageInfo.service
      ? `${_imageInfo.service[0].id || _imageInfo.service[0]['@id']}/full/${width},/0/default.jpg`
      : _imageInfo.type === 'Video'
        ? `https://iiif.juncture-digital.org/thumbnail?url=${_imageInfo.id}`
        : _imageInfo.id
}

export function parseRegionString(region: string, viewer: OpenSeadragon.Viewer) {
  let viewportRect
  const s1 = region.split(':')
  let [x,y,w,h] = s1[s1.length-1].split(',').map(v => parseInt(v))
  const size = viewer.world.getItemAt(0).getContentSize()
  if (s1.length === 2 && (s1[0] === 'pct' || s1[0] === 'percent')) {
    x = Math.round(size.x * x/100),
    y = Math.round(size.y * y/100),
    w = Math.round(size.x * w/100), 
    h = Math.round(size.y * h/100)
  }
  // viewportRect = viewer.viewport.imageToViewportRectangle(rect)
  viewportRect = viewer.viewport.imageToViewportRectangle(x,y,w,h)
  return viewportRect
}

export function getMetadata(manifest:any, language:string = 'en'): any[] {
  let metadata:any[] = []
  if (manifest.metadata) {
    manifest.metadata.forEach((md:any) => {
      metadata.push({label: _value(md.label, language)[0], value: _value(md.value, language)})
    })
  }
  return metadata
}

export function metadataAsObj(manifest:any, language:string = 'en'): any {
  return Object.fromEntries(getMetadata(manifest, language).map(md => [md.label, md.value]))
}

export function top() {
  return stickyElems.length > 0 && stickyElems[0].localName.toLowerCase() === 've-navbar'
    ? parseInt(window.getComputedStyle(stickyElems[0]).height.slice(0,-2))
    : 0
}

function findStickyElems() {
  initTippy()
  let stickyElems = Array.from(document.querySelectorAll('.sticky'))
    // .filter(el => el.localName.toLowerCase() !== 've-content-selector')
  
  let stickyNavBarIdx = stickyElems.findIndex(el => el.localName.toLowerCase() === 've-navbar')
  if (stickyNavBarIdx < 0) {
    let headerIdx = stickyElems.findIndex(el => el.localName.toLowerCase() === 've-header')
    if (headerIdx >= 0) {
      let stickyNavBar = stickyElems[headerIdx]?.shadowRoot?.querySelector('ve-navbar.sticky')
      if (stickyNavBar) {
        stickyElems[headerIdx] = stickyNavBar
        stickyNavBarIdx = headerIdx
      }
    }
  }
  // let main = document.querySelector('main')
  // if (main) main.style.paddingBottom = '75vh'
  stickyElems.forEach((el:any) => setTop(el))
  // console.log('stickyElems', stickyElems)
  return stickyElems
}

function activeRegionOffset() {
  let stickyNavBar = stickyElems.find((el:HTMLElement) => el.localName.toLowerCase() === 've-navbar')
  let offset = stickyNavBar ? stickyNavBar.getBoundingClientRect().top : 0
  stickyElems.forEach(el => {
    let bcr = el.getBoundingClientRect()
    let col = bcr.x < bcr.width ? 0 : 1
    if (col === 0 && bcr.top === offset) {
      let computedHeightStyle = window.getComputedStyle(el).height
      if (computedHeightStyle.length >= 3 && computedHeightStyle.slice(-2) === 'px') {
        offset += parseInt(window.getComputedStyle(el).height.slice(0,-2))
      }
    }
  })
  // console.log(`activeRegionOffset=${offset}`)
  return offset
}

function setTop(el:HTMLElement) {
  if (el.localName.toLowerCase() === 'section') {
    let stickyNavBar = stickyElems.find(el => el.localName.toLowerCase() === 've-navbar')
    // let offset = stickyNavBar ? stickyNavBar.getBoundingClientRect().top : 0
    let offset = stickyNavBar ? stickyNavBar.clientHeight : 0
    el.style.top = `${offset}px`
  }
}

let stickyElems:any[] = []
const mutationObserver = new MutationObserver((mutations) => {
  let nonTippyMutations = mutations.filter(mut => {
    let addedCt = Array.from(mut.addedNodes).filter((node:any) => node.id?.indexOf('tippy') < 0).length
    let removedCt = Array.from(mut.removedNodes).filter((node:any) => node.id?.indexOf('tippy') < 0).length
    return (addedCt + removedCt) > 0
  })
  if (!tippyEntities || nonTippyMutations.length > 0) stickyElems = findStickyElems()
})
mutationObserver.observe(document, { childList: true, subtree: true })

let targets:any = {}
let active: HTMLElement

let offset = 0

const intersectionObserver = new IntersectionObserver (
  (entries) => {
    offset = activeRegionOffset()
    entries.forEach(entry => targets[domPath(entry.target)] = entry)
    let intersecting = Object.values(targets)
      .filter((entry:any) => entry.isIntersecting)
      .filter((entry:any) => entry.target.getBoundingClientRect().y >= offset)
      .sort((a:any,b:any) => a.target.getBoundingClientRect().y > b.target.getBoundingClientRect().y ? 1 : -1)
    // console.log(intersecting.map((entry:any) => ({ el:entry.target, ratio:entry.intersectionRatio })))
    let selected:any = (intersecting.find((entry:any) => entry.intersectionRatio === 1) || intersecting[0])
    if (selected) {
      let selectedEl = selected.target as HTMLElement
      if (Array.from(selectedEl.classList).indexOf('active') < 0) {
        if (active) active.classList.remove('active')
        selectedEl.classList.add('active')
        active = selectedEl
      }
    }
  },
  { root: null, threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: `-${offset}px 0px 0px 0px` }
)
Array.from(document.querySelectorAll('p')).forEach(el => intersectionObserver.observe(el))

export function observeActive(el:HTMLElement) {
  Array.from(el.querySelectorAll('p')).forEach(p => intersectionObserver.observe(p))
}

export function domPath(el: any) {
  var stack = []
  while ( el.parentNode != null ) {
    let sibCount = 0
    let sibIndex = 0
    for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
      let sib = el.parentNode.childNodes[i];
      if ( sib.nodeName == el.nodeName ) {
        if ( sib === el ) {
          sibIndex = sibCount;
        }
        sibCount++
      }
    }
    if ( el.hasAttribute('id') && el.id != '' ) {
      stack.unshift(el.nodeName.toLowerCase() + `#${el.id}`)
    } else if ( sibCount > 1 ) {
      stack.unshift(el.nodeName.toLowerCase() + (sibIndex > 0 ? `[${sibIndex}]` : ''))
    } else {
      stack.unshift(el.nodeName.toLowerCase())
    }
    el = el.parentNode as HTMLElement
  }
  return stack.join('.')
}

let entityData:any = {}
export async function getEntityData(qids: string[] = [], language: string = 'en') {
  let values = qids.filter(qid => !entityData[qid]).map(qid => `(<http://www.wikidata.org/entity/${qid}>)`)
  // console.log(`getEntityData: qids=${qids.length} toGet=${values.length}`)
  if (values.length > 0) {
    let query = `
      SELECT ?item ?label ?description ?alias ?image ?logoImage ?coords ?pageBanner ?whosOnFirst ?wikipedia WHERE {
        VALUES (?item) { ${values.join(' ')} }
        ?item rdfs:label ?label . 
        FILTER (LANG(?label) = "${language}" || LANG(?label) = "en")
        OPTIONAL { ?item schema:description ?description . FILTER (LANG(?description) = "${language}" || LANG(?description) = "en")}
        OPTIONAL { ?item skos:altLabel ?alias . FILTER (LANG(?alias) = "${language}" || LANG(?alias) = "en")}
        OPTIONAL { ?item wdt:P625 ?coords . }
        OPTIONAL { ?item wdt:P18 ?image . }
        OPTIONAL { ?item wdt:P154 ?logoImage . }
        OPTIONAL { ?item wdt:P948 ?pageBanner . }
        OPTIONAL { ?item wdt:P6766 ?whosOnFirst . }
        OPTIONAL { ?wikipedia schema:about ?item; schema:isPartOf <https://${language}.wikipedia.org/> . }
    }`
    let resp = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/sparql-results+json'
      },
      body: `query=${encodeURIComponent(query)}`
    })
    if (resp.ok) {
      let sparqlResp = await resp.json()
      sparqlResp.results.bindings.forEach((rec: any) => {
        let qid = rec.item.value.split('/').pop()
        if (!entityData[qid]) {
          entityData[qid] = {id: qid, label: rec.label.value}
          if (rec.description) entityData[qid].description = rec.description.value
          if (rec.alias) entityData[qid].aliases = [rec.alias.value]
          if (rec.coords) entityData[qid].coords = rec.coords.value.slice(6,-1).split(' ').reverse().join(',')
          if (rec.wikipedia) entityData[qid].wikipedia = rec.wikipedia.value
          if (rec.pageBanner) entityData[qid].pageBanner = rec.pageBanner.value
          if (rec.image) {
            entityData[qid].image = rec.image.value
            entityData[qid].thumbnail = mwImage(rec.image.value, 300)
          }
          if (rec.logoImage) {
            entityData[qid].logoImage = rec.logoImage.value
            if (!entityData[qid].thumbnail) entityData[qid].thumbnail = mwImage(rec.logoImage.value, 300)
          }
          if (rec.whosOnFirst) entityData[qid].geojson = whosOnFirstUrl(rec.whosOnFirst.value)
        } else {
          if (rec.alias) entityData[qid].aliases.push(rec.alias.value)
        }
      })
      // return entityData
      return Object.fromEntries(qids.filter(qid => entityData[qid]).map(qid => [qid,entityData[qid]]))
    }
  }
  // return entityData
  return Object.fromEntries(qids.filter(qid => entityData[qid]).map(qid => [qid,entityData[qid]]))
}

export function isQID(s: string) {
  return s[0] === 'Q' && isNum(s.slice(1))
}

export async function getEntity(qid: string, language: string = 'en') {
  let entities = await getEntityData([qid], language)
  return entities[qid]
}

export function mwImage(mwImg:string, width:number) {
  // Converts Wikimedia commons image URL to a thumbnail link
  mwImg = (Array.isArray(mwImg) ? mwImg[0] : mwImg).replace(/Special:FilePath\//, 'File:').split('File:').pop()
  mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
  const _md5 = md5(mwImg)
  const extension = mwImg.split('.').pop()
  let url = `https://upload.wikimedia.org/wikipedia/commons${width ? '/thumb' : ''}`
  url += `/${_md5.slice(0,1)}/${_md5.slice(0,2)}/${mwImg}`
  if (width) {
    url += `/${width}px-${mwImg}`
    if (extension === 'svg') {
      url += '.png'
    } else if (extension === 'tif' || extension === 'tiff') {
      url += '.jpg'
    }
  }
  return url
}

// Creates a GeoJSON file URL from a Who's on First ID 
function whosOnFirstUrl(wof:string) {
  let wofParts = []
  for (let i = 0; i < wof.length; i += 3) {
    wofParts.push(wof.slice(i,i+3))
  }
  return `https://data.whosonfirst.org/${wofParts.join('/')}/${wof}.geojson`
}

export function isNum(s:string) {
  return s && !isNaN(<any>s)
}

export function parseImageOptions(str: string) {
  let elems = str?.split('/') || []
  // let seq = 1
  let region = 'full'
  let size = 'full'
  let rotation = '0'
  let quality = 'default'
  let format = 'jpg'
  let offset = 0
  /*
  if (isNum(elems[0])) {
    seq = +elems[0]
    offset = 1
  }
  */
  let options = {
    // seq,
    region: elems.length > offset && elems[offset] ? elems[offset] : region,
    size: elems.length > offset+1 && elems[offset+1] ? elems[offset+1] : size,
    rotation: elems.length > offset+2 && elems[offset+2] ? elems[offset+2] : rotation,
    quality: elems.length > offset+3 && elems[offset+3] ? elems[offset+3] : quality,
    format: elems.length > offset+4 && elems[offset+4] ? elems[offset+4] : format
  }
  return options
}

// For cropping regular images
export async function imageDataUrl(url: string, region: any, dest: any): Promise<string> {
  return new Promise((resolve) => {
    let {x, y, w, h} = region
    let {width, height} = dest
    let image = new Image()
    image.crossOrigin = 'anonymous'
    x = x ? x/100 : 0
    y = y ? y/100 : 0
    w = w ? w/100 : 0
    h = h ? h/100 : 0
    image.onload = () => {
      let sw = image.width
      let sh = image.height
      let swScaled = w > 0 ? sw * w : sw - (sw * x)
      let shScaled =  h > 0 ? sh * h : sh - (sh * y)
      let ratio = swScaled/shScaled
      if (ratio > 1) height = width/ratio
      else width = height * ratio
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = width
      canvas.height = height
      x = x*sw
      y = y*sh
      // console.log(`x=${x} y=${y} sw=${sw} sh=${sh} swScaled=${swScaled} shScaled=${shScaled} width=${width} height=${height} ratio=${ratio}`)
      ctx?.drawImage(image, x, y, swScaled, shScaled, 0, 0, width, height)
      let dataUrl = canvas.toDataURL()
      resolve(dataUrl)
    }
    image.src = url
  })
}

let summaryText:any = {}
export async function getSummaryText(qid: string, language='en') {
  // console.log(`getSummaryText: qid=${qid} language=${language}`)
  if (!summaryText[language]) summaryText[language] = {}
  
  if (!summaryText[language][qid] && entityData[qid] && entityData[qid].wikipedia) {
    let wikiUrl = entityData[qid].wikipedia
    let page: number = wikiUrl.replace(/\/w\//, '/wiki').split('/wiki/').pop()
    let url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${page}`
    let resp: any = await fetch(url)
    if (resp.ok) {
      resp = await resp.json()
      summaryText[language][qid] = resp['extract_html'] || resp['extract']
    }
    return summaryText[language][qid]
  } else {
    return summaryText[language][qid]
  }
}