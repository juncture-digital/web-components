<template>

  <div ref="root" class="main">
    <div class="content">
      <div class="buttons">
        <sl-button v-for="qid in qids" :key="qid" @click="selected = qid" pill size="small">
          {{ entities[qid]?.label }}
        </sl-button>
      </div>
      <ve-entity-card v-if="selected" :qid="selected"></ve-entity-card>
    </div>
    <div v-if="props.caption && selected" class="caption">
      {{ props.caption }}
    </div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, ref, toRaw, watch } from 'vue'
  import { isQID, getEntity, getEntityData, isMobile, makeSticky } from '../utils'
  import '@shoelace-style/shoelace/dist/components/button/button.js'

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

  const entities = ref<any>({})

  const activeElem = ref<HTMLElement | null>(null)
  const qids = computed(() => activeElem.value?.getAttribute('entities')?.split(/\s/).filter(entity => entity) || [])
  const selected = ref<string>()

  watch(qids, () => {
    if (qids.value.length > 0) {
      getEntityData(qids.value).then(_entities => {
        entities.value = _entities
        selected.value = qids.value[0]
      })
    } else {
      entities.value = {}
      selected.value = undefined
    }
  })

  watch(host, () => init())

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

  * { box-sizing: border-box; }

  .main {
    margin-bottom: 3rem;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 0 12px 0;
  }

  .caption {
    display: flex;
    align-items: center;
    font-family: sans-serif;
    width: 100%;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 6px;
    bottom: 0;
    height: 32px;
    margin-top: 6px;
  }

</style>