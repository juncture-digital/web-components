import './style.css'
import { defineCustomElement } from 'vue'

import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
setBasePath('https://juncture-digital.github.io/web-components/src')

import AddMediaResourceDialog from './components/AddMediaResourceDialog.ce.vue'
import Contact from './components/Contact.ce.vue'
import ContentSelector from './components/ContentSelector.ce.vue'
import Header from './components/Header.ce.vue'
import Hero from './components/Hero.ce.vue'
import Manifest from './components/Manifest.ce.vue'
import Map from './components/Map.ce.vue'
import MediaCard from './components/MediaCard.ce.vue'
import MediaViewer from './components/MediaViewer.ce.vue'
import Menu from './components/Menu.ce.vue'
import Navbar from './components/Navbar.ce.vue'
import Pager from './components/Pager.ce.vue'
import SiteSearch from './components/SiteSearch.ce.vue'
import Starter from './components/Starter.ce.vue'
import WikidataSearch from './components/WikidataSearch.ce.vue'

customElements.define('ve-add-media-resource-dialog', defineCustomElement(AddMediaResourceDialog))
customElements.define('ve-contact', defineCustomElement(Contact))
customElements.define('ve-content-selector', defineCustomElement(ContentSelector))
customElements.define('ve-header', defineCustomElement(Header))
customElements.define('ve-hero', defineCustomElement(Hero))
customElements.define('ve-manifest', defineCustomElement(Manifest))
customElements.define('ve-map', defineCustomElement(Map))
customElements.define('ve-media', defineCustomElement(MediaViewer))
customElements.define('ve-media-card', defineCustomElement(MediaCard))
customElements.define('ve-menu', defineCustomElement(Menu))
customElements.define('ve-navbar', defineCustomElement(Navbar))
customElements.define('ve-pager', defineCustomElement(Pager))
customElements.define('ve-site-search', defineCustomElement(SiteSearch));
customElements.define('ve-starter', defineCustomElement(Starter));
customElements.define('ve-wikidata-search', defineCustomElement(WikidataSearch));

(window as any).previewInit = function(){ console.log('TODO: previewInit')}