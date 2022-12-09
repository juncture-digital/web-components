import './style.css';
import { defineCustomElement } from 'vue';
import CurrentTime from './components/CurrentTime.ce.vue';

console.log('main.js')

const CurrentTimeComponent = defineCustomElement(CurrentTime);

customElements.define('current-time', CurrentTimeComponent);

document
  .querySelector('current-time')
  .addEventListener('datechange', recordTime);

function recordTime(event) {
  console.log(event.detail[0].value);
}
w