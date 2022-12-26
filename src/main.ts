import './style.css'
import { defineCustomElement } from 'vue'

import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'

// Set the base path to the folder you copied Shoelace's assets to
// setBasePath('/path/to/shoelace/dist')
setBasePath('https://juncture-digital.github.io/web-components/src')

import CurrentTime from './components/CurrentTime.ce.vue'
import MediaViewer from './components/MediaViewer.ce.vue'
import MediaCard from './components/MediaCard.ce.vue'
import Manifest from './components/Manifest.ce.vue'
import Pager from './components/Pager.ce.vue'

customElements.define('current-time', defineCustomElement(CurrentTime))
customElements.define('ve-media', defineCustomElement(MediaViewer))
customElements.define('ve-media-card', defineCustomElement(MediaCard))
customElements.define('ve-manifest', defineCustomElement(Manifest))
customElements.define('ve-pager', defineCustomElement(Pager))

/*
document.querySelector('current-time')?.addEventListener('datechange', recordTime)
function recordTime(event:Event) {
  console.log((event as CustomEvent).detail[0].value)
}
*/
