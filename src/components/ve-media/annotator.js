import * as Annotorious from '@recogito/annotorious-openseadragon'

const ENV = location.hostname === 'localhost' ? 'DEV' : 'PROD'
const annotationsEndpoint = ENV === 'DEV'
? 'http://localhost:8000'
: 'https://api.juncture-digital.org'

export class Annotator {

  constructor(osd, annoPath) {
    this.osd = osd
    this.annoPath = annoPath
    this.annotorious = Annotorious.default(osd, {readOnly: true})
    this.setVisible(false)
  }

  async loadAnnotations(path) {
    path = path || this.annoPath
    let url = `${annotationsEndpoint}/annotations/${path}/`
    console.log(`ve-media.loadAnnotations: ${url}`)
    let resp = await fetch(url)
    if (resp.ok) {
      resp = await resp.json()
      this._target = resp.target
      if (resp.annotations.length > 0) {
        console.log(`Adding ${resp.annotations.length} annotations`)
        this.annotorious.setAnnotations(resp.annotations)
        console.log(resp.annotations)
      }
    }
  }

  setVisible(visible) {
    document.querySelector(`#${this.osd.id} .a9s-annotationlayer`).style.visibility = visible ? 'visible' : 'hidden'
  }

  select(annoId) {
    let annoUri = `${annotationsEndpoint}/annotation/${this.annoPath}/${annoId}`
    console.log(`ve-media.select: annoUri=${annoUri}`)
    let selected = this.annotorious.selectAnnotation(annoUri)
    console.log(selected)
    Array.from(document.querySelectorAll(`#${this.osd.id} .a9s-annotation`)).forEach(el => el.style.visibility = 'hidden')
    if (selected) {
      let annoEl = document.querySelector(`[data-id="${annoUri}"]`)
      if (annoEl) annoEl.style.visibility = 'visible'
      console.log(annoEl)
    }
  }

}
