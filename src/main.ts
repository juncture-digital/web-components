import './style.css'
import { defineCustomElement } from 'vue'

import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
setBasePath('https://juncture-digital.github.io/web-components/src')

import AddMediaResourceDialog from './components/AddMediaResourceDialog.ce.vue'
import Contact from './components/Contact.ce.vue'
import ContentSelector from './components/ContentSelector.ce.vue'
import EntityCard from './components/EntityCard.ce.vue'
import Footer from './components/Footer.ce.vue'
import Header from './components/Header.ce.vue'
import Hero from './components/Hero.ce.vue'
import Manifest from './components/Manifest.ce.vue'
import ManifestPopup from './components/ManifestPopup.ce.vue'
import Map from './components/Map.ce.vue'
import MediaCard from './components/MediaCard.ce.vue'
import MediaViewer from './components/MediaViewer.ce.vue'
import Menu from './components/Menu.ce.vue'
import Mermaid from './components/Mermaid.ce.vue'
import Modal from './components/Modal.ce.vue'
import Navbar from './components/Navbar.ce.vue'
import Pager from './components/Pager.ce.vue'
import SiteSearch from './components/SiteSearch.ce.vue'
import Snippet from './components/Snippet.ce.vue'
import SourceViewer from './components/SourceViewer.ce.vue'
import Starter from './components/Starter.ce.vue'
import WikidataSearch from './components/WikidataSearch.ce.vue'
import Window from './components/Window.ce.vue'

console.log(`juncture.web-components: version=${process.env.version}`)

function init() {
	customElements.define('ve-add-media-resource-dialog', defineCustomElement(AddMediaResourceDialog))
	customElements.define('ve-contact', defineCustomElement(Contact))
	customElements.define('ve-content-selector', defineCustomElement(ContentSelector))
	customElements.define('ve-entity-card', defineCustomElement(EntityCard))
	customElements.define('ve-footer', defineCustomElement(Footer))
	customElements.define('ve-header', defineCustomElement(Header))
	customElements.define('ve-hero', defineCustomElement(Hero))
	customElements.define('ve-manifest', defineCustomElement(Manifest))
	customElements.define('ve-manifest-popup', defineCustomElement(ManifestPopup))
	customElements.define('ve-map', defineCustomElement(Map))
	customElements.define('ve-media', defineCustomElement(MediaViewer))
	customElements.define('ve-media-card', defineCustomElement(MediaCard))
	customElements.define('ve-menu', defineCustomElement(Menu))
	customElements.define('ve-mermaid', defineCustomElement(Mermaid))
	customElements.define('ve-modal', defineCustomElement(Modal))
	customElements.define('ve-navbar', defineCustomElement(Navbar))
	customElements.define('ve-pager', defineCustomElement(Pager))
	customElements.define('ve-snippet', defineCustomElement(Snippet))
	customElements.define('ve-source-viewer', defineCustomElement(SourceViewer))
	customElements.define('ve-site-search', defineCustomElement(SiteSearch))
	customElements.define('ve-starter', defineCustomElement(Starter))
	customElements.define('ve-wikidata-search', defineCustomElement(WikidataSearch))
	customElements.define('ve-window', defineCustomElement(Window))

	document.body.style.transition = 'opacity 0.3s linear'
	document.body.style.visibility = 'visible'
	document.body.style.opacity = '1'
};

// (window as any).previewInit = function(){ console.log('TODO: previewInit')}

// Dynamically load css if needed
/*
let cssSrc = 'https://cdn.jsdelivr.net/npm/juncture-digital/dist/assets/css/index.css'
let junctureStyleEls = Array.from(document.querySelectorAll(`link[href="${cssSrc}"], style[data-vite-dev-id$="/src/style.css"]`))
if (junctureStyleEls.length === 0) {
	let linkEl = document.createElement('link')
	linkEl.href = cssSrc
	linkEl.rel = 'stylesheet'
	linkEl.type = 'text/css'
	console.log('adding juncture css', linkEl)
	linkEl.addEventListener('load', () => {init()})
	let head = document.getElementsByTagName('head')[0]
	let styleEls = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
	if (styleEls.length > 0) head.insertBefore(linkEl, styleEls[0])
	else head.appendChild(linkEl)
} else {
	init()
}
*/
init()
