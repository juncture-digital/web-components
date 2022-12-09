import CurrentTime from "./components/CurrentTime.ce.vue"

const CurrentTimeSimple = {
 install(Vue, options) {
  // Let's register our component globally
  // https://vuejs.org/v2/guide/components-registration.html
  Vue.component("current-time", CurrentTime);
 }
};

// Automatic installation if Vue has been added to the global scope.
if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(CurrentTimeSimple);
}

export default CurrentTimeSimple;