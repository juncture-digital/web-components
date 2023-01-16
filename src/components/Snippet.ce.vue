<template>

  <div ref="root" id="main">

    <sl-tab-group>
      <sl-tab slot="nav" panel="markdown">Markdown</sl-tab>
      <sl-tab slot="nav" panel="html">HTML</sl-tab>
      <sl-tab slot="nav" panel="preview">Demo</sl-tab>
      <sl-tab-panel name="markdown">
        <ve-source-viewer v-if="active === 'markdown'" v-html="markdown"></ve-source-viewer>
      </sl-tab-panel>
      <sl-tab-panel name="html">
        <ve-source-viewer v-if="active === 'html' && html" v-html="html" language="html"></ve-source-viewer>    
      </sl-tab-panel>
      <sl-tab-panel name="preview">
        <div v-if="active === 'preview' && html" v-html="html" draggable="true" @dragstart="onDrag"></div>
      </sl-tab-panel>
    </sl-tab-group>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, nextTick, ref, toRaw, watch } from 'vue'
  import { initTippy } from '../utils'

  import '@shoelace-style/shoelace/dist/components/tab/tab.js'
  import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js'
  import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js'
  import type SlTab from '@shoelace-style/shoelace/dist/components/tab/tab.js'

  const apiEndpoint = location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://api.juncture-digital.org'

  const props = defineProps({
    prefix: { type: String },
    right: { type: Boolean },
    left: { type: Boolean },
    width: { type: String },
    height: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const content = computed(() => shadowRoot.value?.querySelector('sl-tab-group') as HTMLElement)
  
  const markdown = ref<string>()
  const html = ref<string>()
  const active = ref<string>()

  watch(host, () => {
    let lines:string[] = host.value.textContent.split('\n')
    let trimmed:string[] = []
    lines.forEach(line => {
      if (line.trim().length > 0 || trimmed.length > 0) trimmed.push(line)
    })
    if (trimmed.length > 0) {
      let firsLineIndent = (trimmed[0].match(/(^\s+)/) || [''])[0].length
      markdown.value = trimmed.map(line => {
        let leadingSpaces = (line.match(/(^\s+)/) || [''])[0].length
        return leadingSpaces >= firsLineIndent
          ? line.slice(firsLineIndent)
          : line
      }).join('\n')
    }
  })

  watch(active, () => {
    if (active.value !== 'markdown' && html.value === undefined) getHTML()
    if (active.value === 'preview') nextTick(() => initTippy(shadowRoot.value, true))
  })

  watch(content, () => {
    shadowRoot.value?.querySelectorAll('sl-tab').forEach(el => {
      const observer = new MutationObserver((mutations) => {
        let slTab = mutations[0].target as SlTab
        if (slTab.getAttribute('aria-selected') === 'true') active.value = slTab.getAttribute('panel')?.valueOf()
        //if (slTab.getAttribute('panel') !== 'markdown' &&  {
        //  if (html.value === undefined) getHTML()
        //}
      })
      observer.observe(el, { attributes: true })
    })
  })

  const position:string = props.right ? 'right' : props.left ? 'left' : 'full'

  function doLayout() {
    host.value.classList.add('ve-component')
    host.value.classList.add(position)
    if (position === 'full') {
      host.value.style.width = '100%'
    } else {
      host.value.style.float = position
      host.value.style.width = '50%'
    }
    host.value.style.width = window.getComputedStyle(host.value).width

    content.value.style.width = props.width || '100%'
    let width = parseInt(window.getComputedStyle(content.value).width.slice(0,-2))
    content.value.style.width = `${width}px`
    // content.value.style.height = `${width}px`
  }

  function getHTML() {
    html.value = ''
    fetch(`${apiEndpoint}/html/?inline=true`, {
      method: 'POST',
      body: JSON.stringify({
        prefix: `${props.prefix}`,
        path: '',
        markdown: markdown.value
      })
    })
    .then(resp => resp.text())
    .then(pageHtml => {
      let htmlEls = new DOMParser().parseFromString(pageHtml, 'text/html').children[0].children
      let _html = htmlEls[1].querySelector('main')?.innerHTML
      if (_html) html.value = _html
      nextTick(() => initTippy(shadowRoot.value, true))
    })
  }

  function onDrag(evt:DragEvent) {
    let text = markdown.value
    if (text) evt.dataTransfer?.setData('text/plain', text)
  }

</script>

<style src='../style.css'></style> 

<style>

  * { box-sizing: border-box; }

  #main {
    font-family: Roboto, sans-serif;
    border: 0.5px solid #ddd;
    border-radius: 6px;
    padding: 0 6px;  
    margin-bottom: 2rem;
    font-size: 1.2rem;
  }

</style>