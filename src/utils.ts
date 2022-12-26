export const iiifServer = 'https://iiif.juncture-digital.org'
import { sha256 as __sha256 } from 'js-sha256'

export function isURL(str:string) { return /^https*:\/\//.test(str) }

export function sha256(str: string) {
  return __sha256(str)
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
    if (target.style.top) topOffset += parseInt(target.style.marginTop.slice(0,-2))
    target.style.top = `${topOffset}px`
  }
  setTop()
  const observer = new MutationObserver(setTop)
  observer.observe(navbar, { attributes: true })
}

export function makeSticky(el:HTMLElement) {
  el.classList.add('sticky')
  el.style.position = 'sticky'
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

export function thumbnail(manifest: any, width:number=400) {
  if (!manifest) return null
  //if (manifest.thumbnail) {
  //  return manifest.thumbnail[0].id
  //} else {
    let _imageInfo = getItemInfo(manifest)
    return _imageInfo.service
      ? `${_imageInfo.service[0].id || _imageInfo.service[0]['@id']}/full/${width},/0/default.jpg`
      : _imageInfo.type === 'Video'
        ? `https://iiif.juncture-digital.org/thumbnail?url=${_imageInfo.id}`
        : _imageInfo.id
  //}
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

export function top() {
  return stickyElems.length > 0 && stickyElems[0].localName.toLowerCase() === 've-navbar'
    ? parseInt(window.getComputedStyle(stickyElems[0]).height.slice(0,-2))
    : 0
}

function findStickyElems() {
  // initTippy()
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
  return stickyElems
}

function activeRegionOffset() {
  let stickyNavBar = stickyElems.find(el => el.localName.toLowerCase() === 've-navbar')
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
const mutationObserver = new MutationObserver(() => stickyElems = findStickyElems())
mutationObserver.observe(document, { childList: true, subtree: true })

let targets:any = {}
let active: HTMLElement

let offset = 0

const intersectionObserver = new IntersectionObserver (
  (entries) => {
    offset = activeRegionOffset()
    // console.log(offset)
    entries.forEach(entry => targets[domPath(entry.target)] = entry)
    let intersecting = Object.values(targets)
      .filter((entry:any) => entry.isIntersecting)
      .filter((entry:any) => entry.target.getBoundingClientRect().y >= offset)
      .sort((a:any,b:any) => a.target.getBoundingClientRect().y > b.target.getBoundingClientRect().y ? 1 : -1)
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