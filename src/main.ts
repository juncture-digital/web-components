import './style.css'
import { defineCustomElement } from 'vue'

// import CurrentTime from './components/CurrentTime.ce.vue'
import Manifest from './components/Manifest.ce.vue';
import MediaViewer from './components/MediaViewer.ce.vue';

// customElements.define('current-time', defineCustomElement(CurrentTime))
customElements.define('ve-manifest-beta', defineCustomElement(Manifest))
customElements.define('ve-media-beta', defineCustomElement(MediaViewer))

/*
document.querySelector('current-time')?.addEventListener('datechange', recordTime)
function recordTime(event:Event) {
  console.log((event as CustomEvent).detail[0].value)
}
*/
