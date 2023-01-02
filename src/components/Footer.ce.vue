<template>

  <div ref="root" class="main">
    <div v-for="li, idx in footerElems" :key="`li-${idx}`" :class="li.className" :style="styleToObj(li.getAttribute('style') || '')" v-html="li.innerHTML"></div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, ref, watch } from 'vue'

  const props = defineProps({
    sticky: { type: Boolean }
  })

  const footerElems = ref<HTMLElement[]>([])

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  watch(host, () => init())
  
  function init() {
    if (props.sticky) setSticky()
    footerElems.value = Array.from(host.value?.querySelectorAll('li'))
  }

  function setSticky() {
    host.value.classList.add('sticky')
    let footerHeight = host.value.offsetHeight
    footerHeight += parseInt(window.getComputedStyle(host.value).getPropertyValue('margin-top'))
    footerHeight += parseInt(window.getComputedStyle(host.value).getPropertyValue('margin-bottom'))
    let mainEl = document.querySelector('main')
    if (mainEl) mainEl.style.paddingBottom = `${footerHeight}px`
    host.value.style.width = `${host.value.parentElement.clientWidth}px`
    document.body.style.marginBottom = '80px'
  }

  function styleToObj(s:string) {
    // Converts style value to object
    return s
      ? Object.fromEntries(s.split(';').filter(s => s.trim()).map(s => s.split(':').map(s => s.trim())))
      : {}
  }

</script>

<style>

  * {box-sizing: border-box;}

  .main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 9px 12px;
    margin: auto;
    font-family: Roboto, sans-serif;
    z-index: 100;
    background-color: #444;
    color: white;
    margin-top: 36px;
  }

  .main.sticky {
    position: fixed;
    bottom: 0;
  }

  div {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  img {
    height: 36px;
    vertical-align: middle;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .logo, .logo img {
    height: 20px;
  }

  .push {
    margin-left: auto;
  }

</style>