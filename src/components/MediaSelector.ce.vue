<template>

  <div ref="root" class="main">
    <div class="content">
      <ve-media v-if="items.length > 0" grid small :caption="$props.caption">
        <ul>
          <li v-for="item, idx in items" :key="`item-${idx}`">{{ item }}</li>
        </ul>
      </ve-media>
    </div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, ref, toRaw, watch } from 'vue'
  import { isMobile, makeSticky } from '../utils'

  const props = defineProps({
    caption: { type: String },
    width: { type: String },
    height: { type: String },
    sticky: { type: Boolean },
    full: { type: Boolean },
    left: { type: Boolean },
    right: { type: Boolean },
 })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const content = computed(() => shadowRoot.value?.querySelector('.content') as HTMLElement)

  const activeElem = ref<HTMLElement | null>(null)
  const items = computed(() => activeElem.value?.getAttribute('data-media')?.split(/\s/).filter(entity => entity) || [])
  const selected = ref<string>()

  watch(host, () => init())
  watch(selected, () => console.log(`selected=${toRaw(selected.value)}`))

  function init() {
    doLayout()
    watchActive()
  }

  const position:string = isMobile() ? 'full' : (props.right ? 'right' : props.left ? 'left' : 'full')

  function doLayout() {
    host.value.classList.add('ve-component')
    host.value.classList.add(position)
    if (position === 'full') {
      host.value.style.width = '100%'
    } else {
      host.value.style.float = position
      host.value.style.width = 'calc(50% - 16px)'
    }
    host.value.style.width = window.getComputedStyle(host.value).width

    if (props.sticky) makeSticky(host.value)

    content.value.style.width = props.width || '100%'
    nextTick(() => {
      let width = parseInt(window.getComputedStyle(content.value).width.slice(0,-2))
      let height = width
      if (props.sticky && position === 'full') {
        let maxStickyHeight = Math.round(window.innerHeight * .4)
        height = Math.min(maxStickyHeight, width)
      } 
      // console.log(`width=${width} height=${height}`)
      content.value.style.width = `${width}px`
      content.value.style.height = `${height}px`
    })
  }

  function watchActive() {
    activeElem.value = document.querySelector('.active')
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          let target = mutation.target as HTMLElement
          if (Array.from(target.classList).indexOf('active') >= 0) activeElem.value = target
        }
      })
    })
    observer.observe(document, { subtree: true, attributes: true })
  }

</script>

<style>

  sl-button {
    margin: 6px 3px;
  }

</style>