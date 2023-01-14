<template>

<div ref="root" :style="{width: '100%', height: '100%'}">
  
  <pre class="language-juncture" style="white-space:pre; white-space:pre-wrap; word-wrap:break-word;">
    <code v-html="rawText"></code>
  </pre>

</div>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue'

  import Prism from 'prismjs'

  import 'prismjs/components/prism-markdown'
  import 'prismjs/themes/prism.css'

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host as HTMLElement)
  const shadowRoot = computed(() => root?.value?.parentNode)

  const props = defineProps({
    src: { type: String }
  })

  const rawText = ref<string>()
  
  watch(host, () => {
    let text = host.value?.innerHTML.trim()
    if (text) rawText.value = `\n${text}`
  })

  watch(rawText, () => {
    if (rawText.value) nextTick(() => Prism.highlightElement(shadowRoot.value?.querySelector('pre')))
  })

  onMounted(() => {
    if (props.src) {
      fetch(`https://api.juncture-digital.org/markdown/${props.src}`)
        .then(resp => resp.text())
        .then(markdown => rawText.value = `\n${markdown.trim()}`)
    }
  })

  Prism.languages.juncture = Prism.languages.extend('markdown', {
    'tag': [
      {
        pattern: /\.ve-[a-zA-Z-]+/
      },
    ],
    'manifest-url': [
      {
        pattern: /\s+[a-z]+:[a-z0-9-\/\.]+/i,
        inside: {
          'url': /\s+[a-z]+:[a-z0-9-\/\.]+/i,
          'punctuation': /\s+/
        }
      },
    ],
    'position': [
      {
        pattern: /(full|left|right|sticky)/,
        alias: 'class-name'
      },
    ],
    'attribute': [
      {
        pattern: /\s+[a-z-]+/,
        inside: {
          'string': /[a-z-]+/i,
          'punctuation': /\s+/
        }
      },
    ]

  })

</script>

<style src='prismjs/themes/prism.css'></style> 

<style>
</style>
