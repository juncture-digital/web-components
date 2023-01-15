<template>

  <div ref="root" class="main">
    
    <template v-for="li, idx in footerElems" :key="`li-${idx}`">

      <sl-icon v-if="icons[li.innerHTML]" 
        :name="icons[li.innerHTML].icon" 
        label="icons[li.innerHTML].label"
        @click="onClick(li, $event)"
      ></sl-icon>

      <div v-else
        :class="li.className" 
        :style="styleToObj(li.getAttribute('style') || '')" 
        v-html="li.innerHTML"
        @click="onClick(li, $event)"
      ></div>

    </template>

    <sl-dialog label="Page Source" class="page-source-dialog" style="--width: 80vw;">
      <ve-source-viewer v-if="sourcePath" :src="sourcePath"></ve-source-viewer>
      <sl-button slot="footer" variant="primary" @click="showPageSourceDialog = false">Close</sl-button>
    </sl-dialog>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, ref, toRaw, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import '@shoelace-style/shoelace/dist/components/icon/icon.js'

  const props = defineProps({
    sticky: { type: Boolean }
  })

  const icons:any = {
    'view-code': {icon: 'code', label: 'View Page Code'}
  }

  const footerElems = ref<HTMLUListElement[]>([])

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const shadowRoot = computed(() => root?.value?.parentNode)

  const showPageSourceDialog = ref(false)
  watch(showPageSourceDialog, () => pageSourceDialog.open = showPageSourceDialog.value )

  let pageSourceDialog: any

  const sourcePath = ref<string>()

  watch(host, () => {
    pageSourceDialog = shadowRoot.value?.querySelector('.page-source-dialog')
    pageSourceDialog.addEventListener('sl-hide', () => showPageSourceDialog.value = false)
  })

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

  function showSource() {
    sourcePath.value = (window as any).PREFIX
      ? `${(window as any).PREFIX}/${location.pathname.split('/').filter(pe => pe).filter(pe => pe !== 'editor').join('/')}`
      : location.pathname.split('/').filter(pe => pe).filter(pe => pe !== 'editor').join('/')
    // console.log('showSource', toRaw(sourcePath.value))
    showPageSourceDialog.value = true
  }

  function onClick(el:HTMLUListElement, evt:MouseEvent) {
    if (el.innerHTML === 'view-code') {
      evt.stopPropagation()
      showSource()
    }
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

  div {
    cursor: pointer;
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

 sl-dialog::part(panel) {
  color: #444;
  font-size: medium;
}

</style>