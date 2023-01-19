<template>

  <div ref="root" id="main">

    <sl-button @click="showDialog = !showDialog">{{props.buttonLabel}}</sl-button>

    <sl-dialog :label="label" class="dialog" style="--width: 80vw;">
      <div id="content" v-html="html" draggable="true" @dragstart="onDrag"></div>
      <sl-button slot="footer" variant="primary" @click="showDialog = false">Close</sl-button>
    </sl-dialog>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, ref, watch } from 'vue'
  import { initTippy } from '../utils'

  import '@shoelace-style/shoelace/dist/components/button/button.js'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import type SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'
  import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js'

  const apiEndpoint = location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://api.juncture-digital.org'

  const props = defineProps({
    src: { type: String },
    prefix: { type: String },
    label: { type: String },
    buttonLabel: { type: String, default: 'Show me' },
    width: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const content = computed(() => shadowRoot.value?.querySelector('#main') as HTMLElement)
  
  const showDialog = ref(false)
  watch(showDialog, () => {
    dialog.open = showDialog.value
    if (!html.value) getHTML()
  })

  let dialog: any

  const markdown = ref<string>()
  const html = ref<string>()

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

  watch(content, () => {
    dialog = shadowRoot.value?.querySelector('.dialog')
    dialog.addEventListener('sl-hide', (evt:CustomEvent) => {
      if (evt.target === dialog) showDialog.value = false
    })
  })

  function getHTML() {
    html.value = ''
    if (props.src) {
      fetch(`${apiEndpoint}/html/${props.src}`)
      .then(resp => resp.text())
      .then(_html => {
        html.value = _html
        nextTick(() => initTippy(shadowRoot.value, true))
      })
    } else {
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
    margin-bottom: 2rem;
  }

  sl-dialog::part(body) {
    padding-top: 0;
  }

</style>