// import './style.css'
// import './tailwind.css'
import { defineCustomElement } from 'vue'

import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
// setBasePath('https://juncture-digital.github.io/web-components/src')
setBasePath('https://raw.githubusercontent.com//juncture-digital/web-components/main/src')

import AddMediaResourceDialog from './components/AddMediaResourceDialog.ce.vue'
import Auth from './components/Auth.ce.vue'
import Button from './components/Button.ce.vue'
import Contact from './components/Contact.ce.vue'
import ContentSelector from './components/ContentSelector.ce.vue'
import Entities from './components/Entities.ce.vue'
import EntityCard from './components/EntityCard.ce.vue'
import EntityInfobox from './components/EntityInfobox.ce.vue'
import Essay from './components/Essay.ce.vue'
import FAB from './components/FAB.ce.vue'
import Footer from './components/Footer.ce.vue'
import GIF from './components/GIF.ce.vue'
import Header from './components/Header.ce.vue'
import Hero from './components/Hero.ce.vue'
import IFrame from './components/IFrame.ce.vue'
import InfoCard from './components/InfoCard.ce.vue'
import Manifest from './components/Manifest.ce.vue'
import ManifestPopup from './components/ManifestPopup.ce.vue'
import Map from './components/Map.ce.vue'
import MediaCard from './components/MediaCard.ce.vue'
import MediaSelector from './components/MediaSelector.ce.vue'
import MediaViewer from './components/MediaViewer.ce.vue'
import Menu from './components/Menu.ce.vue'
import MenuTWP from './components/MenuTWP.ce.vue'
import Menu1 from './components/Menu1.ce.vue'
import Mermaid from './components/Mermaid.ce.vue'
import Modal from './components/Modal.ce.vue'
import Navbar from './components/Navbar.ce.vue'
import Pager from './components/Pager.ce.vue'
import PlantSpecimen from './components/PlantSpecimen.ce.vue'
import SiteSearch from './components/SiteSearch.ce.vue'
import Snippet from './components/Snippet.ce.vue'
import SourceViewer from './components/SourceViewer.ce.vue'
import Spacer from './components/Spacer.ce.vue'
import Starter from './components/Starter.ce.vue'
import Trigger from './components/Trigger.ce.vue'
import Version from './components/Version.ce.vue'
import WikidataSearch from './components/WikidataSearch.ce.vue'
import Window from './components/Window.ce.vue'
import NewMenu from './components/MenuAuth.ce.vue'

console.log(`juncture.web-components: version=${process.env.version}`)

function init() {
	customElements.define('ve-add-media-resource-dialog', defineCustomElement(AddMediaResourceDialog))
	customElements.define('ve-auth', defineCustomElement(Auth))
	customElements.define('ve-button', defineCustomElement(Button))
	customElements.define('ve-contact', defineCustomElement(Contact))
	customElements.define('ve-content-selector', defineCustomElement(ContentSelector))
	customElements.define('ve-entities', defineCustomElement(Entities))
	customElements.define('ve-entity-card', defineCustomElement(EntityCard))
	customElements.define('ve-entity-infobox', defineCustomElement(EntityInfobox))
	customElements.define('ve-essay', defineCustomElement(Essay))
	customElements.define('ve-fab', defineCustomElement(FAB))
	customElements.define('ve-footer', defineCustomElement(Footer))
	customElements.define('ve-header', defineCustomElement(Header))
	customElements.define('ve-gif', defineCustomElement(GIF))
	customElements.define('ve-hero', defineCustomElement(Hero))
	customElements.define('ve-iframe', defineCustomElement(IFrame))
	customElements.define('ve-info-card', defineCustomElement(InfoCard))
	customElements.define('ve-manifest', defineCustomElement(Manifest))
	customElements.define('ve-manifest-popup', defineCustomElement(ManifestPopup))
	customElements.define('ve-map', defineCustomElement(Map))
	customElements.define('ve-media', defineCustomElement(MediaViewer))
	customElements.define('ve-media-card', defineCustomElement(MediaCard))
	customElements.define('ve-media-selector', defineCustomElement(MediaSelector))
	customElements.define('ve-menu', defineCustomElement(Menu))
	customElements.define('ve-menu1', defineCustomElement(Menu1))
	customElements.define('ve-menu-twp', defineCustomElement(MenuTWP))
	customElements.define('ve-mermaid', defineCustomElement(Mermaid))
	customElements.define('ve-modal', defineCustomElement(Modal))
	customElements.define('ve-navbar', defineCustomElement(Navbar))
	customElements.define('ve-pager', defineCustomElement(Pager))
	customElements.define('ve-plant-specimen', defineCustomElement(PlantSpecimen))
	customElements.define('ve-snippet', defineCustomElement(Snippet))
	customElements.define('ve-source-viewer', defineCustomElement(SourceViewer))
	customElements.define('ve-site-search', defineCustomElement(SiteSearch))
	customElements.define('ve-spacer', defineCustomElement(Spacer))
	customElements.define('ve-starter', defineCustomElement(Starter))
	customElements.define('ve-trigger', defineCustomElement(Trigger))
	customElements.define('ve-version', defineCustomElement(Version))
	customElements.define('ve-wikidata-search', defineCustomElement(WikidataSearch))
	customElements.define('ve-window', defineCustomElement(Window))
	customElements.define('ve-new-menu', defineCustomElement(NewMenu))

	document.body.style.transition = 'opacity 0.3s linear'
	document.body.style.visibility = 'visible'
	document.body.style.opacity = '1'
};

init()
