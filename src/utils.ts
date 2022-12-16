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
  if (_itemInfo.service) _itemInfo.service = _itemInfo.service
    .map((svc:any) => ({...svc, ...{id: (svc.id || svc['@id']).replace(/\/info\.json$/,'')}}))
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