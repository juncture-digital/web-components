<template>

  <div ref="root" id="main">

    <sl-details v-if="collapsible" class="custom-icons" :open="props.open" :draggable="!props.disableDrag" @dragstart="onDrag">
      
      <sl-icon name="plus-square" slot="expand-icon"></sl-icon>
      <sl-icon name="dash-square" slot="collapse-icon"></sl-icon>

      <div slot="summary">
        <sl-tooltip content="Show code snippets" placement="top">
            <div :style="{display: 'flex', alignItems: 'center', gap: '9px'}">
              <sl-icon name="markdown" style="font-size:24px"></sl-icon>
              <sl-icon name="code-slash" style="font-size:24px"></sl-icon>
              <!-- <sl-icon name="eye" style="font-size:24px"></sl-icon> -->
              <span v-html="props.label" class="label"></span>
          </div>
        </sl-tooltip>
      </div>

      <sl-tab-group>
        <sl-tab slot="nav" panel="markdown"><sl-icon name="markdown"></sl-icon>Markdown</sl-tab>
        <sl-tab slot="nav" panel="html"><sl-icon name="code-slash"></sl-icon>HTML</sl-tab>
        <sl-tab slot="nav" panel="wordpress"><sl-icon name="wordpress"></sl-icon>Wordpress</sl-tab>
        <sl-tab slot="nav" panel="preview"><sl-icon name="eye"></sl-icon>Rendered</sl-tab>
        <sl-tab-panel name="markdown">
          <ve-source-viewer v-if="markdown && active === 'markdown'" :draggable="!props.disableDrag">{{ markdown }}</ve-source-viewer>
        </sl-tab-panel>
        <sl-tab-panel name="html">
          <ve-source-viewer v-if="active === 'html' && html" v-html="html" language="html" :draggable="!props.disableDrag"></ve-source-viewer>    
        </sl-tab-panel>
        <sl-tab-pane name="wordpress">
          <ve-source-viewer v-if="active === 'wordpress' && wxr" language="wxr" :draggable="!props.disableDrag">{{ wxr }}</ve-source-viewer>    
        </sl-tab-pane>
        <sl-tab-panel name="preview">
          <div id="juncture" style="position:relative;" v-if="active === 'preview' && html" v-html="html" :draggable="!props.disableDrag" @dragstart="onDrag"></div>
        </sl-tab-panel>
      </sl-tab-group>

    </sl-details>

    <sl-tab-group v-else>
      <sl-tab slot="nav" panel="markdown"><sl-icon name="markdown"></sl-icon>Markdown</sl-tab>
      <sl-tab slot="nav" panel="html"><sl-icon name="code-slash"></sl-icon>HTML</sl-tab>
      <sl-tab slot="nav" panel="wordpress"><sl-icon name="wordpress"></sl-icon>Wordpress</sl-tab>
      <sl-tab slot="nav" panel="preview"><sl-icon name="eye"></sl-icon>Rendered</sl-tab>
      <sl-tab-panel name="markdown">
        <ve-source-viewer v-if="markdown && active === 'markdown'" :draggable="!props.disableDrag">{{ markdown }}</ve-source-viewer>
      </sl-tab-panel>
      <sl-tab-pane name="html">
        <ve-source-viewer v-if="active === 'html' && html" v-html="html" language="html" :draggable="!props.disableDrag"></ve-source-viewer>    
      </sl-tab-pane>
      <sl-tab-pane name="wordpress">
        <ve-source-viewer v-if="active === 'wordpress' && wxr" language="wxr" :draggable="!props.disableDrag">{{ wxr }}</ve-source-viewer>    
      </sl-tab-pane>
      <sl-tab-panel name="preview">
        <div id="juncture" style="position:relative;" v-if="active === 'preview' && html" v-html="html" :draggable="!props.disableDrag" @dragstart="onDrag"></div>
      </sl-tab-panel>
    </sl-tab-group>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, nextTick, ref, toRaw, watch } from 'vue'
  import { initTippy, observeActive } from '../utils'

  import '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import '@shoelace-style/shoelace/dist/components/details/details.js'
  import '@shoelace-style/shoelace/dist/components/tab/tab.js'
  import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js'
  import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js'
  import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'
  import type SlTab from '@shoelace-style/shoelace/dist/components/tab/tab.js'

  const props = defineProps({
    label: { type: String },
    tabs: { type: String, default: 'markdown,html,wordpress,preview' },
    collapsible: { type: Boolean, default: false },
    open: { type: Boolean, default: false },
    prefix: { type: String },
    path: { type: String },
    right: { type: Boolean },
    left: { type: Boolean },
    width: { type: String },
    height: { type: String },
    fill: { type: Boolean },
    showActive: { type: Boolean },
    disableDrag: { type: Boolean },
    src: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  
  const markdown = ref<string>()
  const html = ref<string>()
  const wxr = ref<string>()
  const active = ref<string>()
  const tabs = ref<string[]>()

  // watch(markdown, () => console.log('markdown', markdown.value))

  watch(html, () => getWxr())

  onMounted(() => {
    if (props.src) {
      fetch(`/${props.src}?fmt=md`)
        .then(resp => resp.text())
        .then(md => {
          markdown.value = md.replace(/>/g,'&gt;').replace(/</g,'&lt;')
        })
    }
  })

  watch(host, () => {
    if (props.tabs) tabs.value = props.tabs.split(',')
    else tabs.value = ['markdown', 'html', 'wordpress', 'preview']
    let text = host.value.innerHTML
      .replace(/<pre v-pre="" data-lang="markup"><code class="lang-markup">/,'')
      .replace(/<\/code><\/pre>/, '')
    let lines:string[] = text.split('\n')

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
    if (active.value === 'preview') nextTick(() => {
      initTippy(shadowRoot.value, true)
      // observeActive(shadowRoot.value?.querySelector('#juncture') as HTMLElement)
    })
    if (props.fill && html.value) nextTick(() => setFill())
    if (props.height) nextTick(() => setHeight())
  })
  
  function addObserver() {
    shadowRoot.value?.querySelectorAll('sl-tab').forEach(el => {
      const observer = new MutationObserver((mutations) => {
        let slTab = mutations[0].target as SlTab
        slTab.disabled = !tabs.value?.includes(slTab.panel)
        slTab.style.visibility = slTab.disabled ? 'hidden' : 'visible'
        if (slTab.active) active.value = slTab.panel
      })
      observer.observe(el, { childList: true, subtree: true, attributes: true })
    })
  }

  watch(tabs, () => addObserver())

  function setHeight() {
    let container = shadowRoot.value?.querySelector('sl-tab-panel[name="preview"]') as HTMLElement
    if (active.value === 'preview' && props.height) container.style.height = props.height
  }

  function setFill() {
    let container = shadowRoot.value?.querySelector('sl-tab-panel[name="preview"]') as HTMLElement
    if (active.value === 'preview') {
      let main = shadowRoot.value?.querySelector('#juncture') as HTMLElement
      let width = container.clientWidth / 2
      let filler = document.createElement('div')
      filler.style.height = `${width}px`
      let footer = main.querySelector('ve-footer')
      if (footer) main.insertBefore(filler, footer)
      else main.appendChild(filler)
      container.style.height = props.height || `${Math.max(width/2, 500)}px`
      container.style.overflowY = 'scroll'
    } else {
      container.style.height = ''
    }
  }
  
  function getHTML() {
    html.value = ''
    fetch('/html/', {
      method: 'POST',
      body: JSON.stringify({
        prefix: `${props.prefix || ''}`,
        path: `${props.path || ''}`,
        markdown: markdown.value
      })
    })
    .then(resp => resp.text())
    .then(pageHtml => {
      let htmlEls = new DOMParser().parseFromString(pageHtml, 'text/html').children[0].children
      let main = htmlEls[1].querySelector('main')
      if (main) {
        let customStyleBody = htmlEls[1].querySelector('style')
        if (customStyleBody) main.insertBefore(customStyleBody, main.firstChild)
        html.value = main.innerHTML
        if (active.value === 'preview') nextTick(() => {
          if (props.fill) setFill()
          initTippy(shadowRoot.value, true)
          observeActive(shadowRoot.value?.querySelector('#juncture') as HTMLElement)
        })
      }
    })
  }

  function getWxr() {
    if (html.value) {
      wxr.value = ''
      fetch('/wxr/', {
        method: 'POST',
        body: JSON.stringify({
          prefix: `${props.prefix || ''}`,
          path: `${props.path || ''}`,
          html: html.value
        })
      })
      .then(resp => {
        return resp.text()
      })
      .then(text => wxr.value = text)
    }
  }

  function onDrag(evt:DragEvent) {
    let text = markdown.value
    if (text) evt.dataTransfer?.setData('text/plain', text)
  }

</script>

<style src='../style.css'></style> 

<style>

  * { box-sizing: border-box; }

  :host {
    display: block;
    margin-top: 1.5rem;
    border-radius: 2px;
    border: 0.5px solid #ddd;
    margin-bottom: 2rem;
  }

  :host([collapsible]) {
    border: none;
  }

  #main {
    font-family: Roboto, sans-serif;
    margin-top: 0;
  }

  sl-tab-panel {
    --padding: 0;
  }

  sl-tab::part(base) {
    padding: 12px;
  }

  #juncture {
    padding: 12px;
    font-size: 1.2em;
    line-height: 1.3;;
  }

  sl-details::part(header) {
    /* background: rgba(66,185,131,.1); */
    background-color: rgb(249,249,249);
  }

  sl-details::part(summary) {
    font-size: 1rem;
  }

  sl-details::part(content) {
    border-top: 1px solid #ddd;
    padding: 0;
  }

  sl-details.custom-icons::part(summary-icon) {
    /* Disable the expand/collapse animation */
    rotate: none;
  }

  sl-tab sl-icon {
    font-size: 24px;
    margin-right: 6px;
  }

  .label {
    margin-left: 12px;
    color: #555;
    font-weight: normal;
  }

</style>