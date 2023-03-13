<template>

  <div v-cloak ref="root" id="main">
    <div v-if="html" id="juncture" v-html="html"></div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, nextTick, ref, toRaw, watch } from 'vue'
  import { initTippy, observeActive } from '../utils'

  const apiEndpoint = location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://api.juncture-digital.org'

  const props = defineProps({
    src: { type: String },
    prefix: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
  const raw = computed(() => host.value?.querySelector('pre')?.textContent)
  
  const markdown = ref<string>()
  const html = ref<string>()

  watch(raw, () => {
    let lines:string[] = raw.value.split('\n')
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

  watch(markdown, () => getHTML())

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

  function getHTML() {
    html.value = ''
    let url = `${apiEndpoint}/html/?inline=true`
    fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        prefix: `${props.prefix || ''}`,
        path: '',
        markdown: markdown.value
      })
    })
    .then(resp => resp.text())
    .then(pageHtml => {
      let htmlEls = new DOMParser().parseFromString(pageHtml, 'text/html').children[0].children
      let main = htmlEls[1].querySelector('main')
      if (main) main.id = "juncture"
      if (main) html.value = main.innerHTML
      nextTick(() => {
        let junctureEl = shadowRoot.value?.querySelector('#juncture') as HTMLElement
        if (junctureEl) observeActive(junctureEl)
      })
    })
  }

</script>

<style src='../style.css'></style> 

<style>

  [v-cloak] {
    display: none;
  }

  * { box-sizing: border-box; }

  #main {
    font-family: Roboto, sans-serif;
    margin-top: 0;
  }

  #juncture {
    padding: 12px;
    font-size: 1.2em;
    line-height: 1.3;
  }

  @media (max-width: 480px) {
    #juncture {
      padding: 0;
    }
  }

</style>