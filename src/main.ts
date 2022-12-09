import './style.css';
import { defineCustomElement } from 'vue';
import CurrentTime from './components/CurrentTime.ce.vue';

const CurrentTimeComponent = defineCustomElement(CurrentTime);
customElements.define('current-time', CurrentTimeComponent);

// document.querySelector('current-time')?.addEventListener('datechange', recordTime)

function recordTime(event:Event) {
  console.log((event as CustomEvent).detail[0].value);
}
