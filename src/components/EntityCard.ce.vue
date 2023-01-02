<template>

<div ref="root" id="card" class="card">
  <div class="label" v-html="entity?.label"></div>
    <div class="description" v-html="entity?.description"></div>
      <div v-if="backgroundImage" class="image" :style="{backgroundImage:backgroundImage, width: thumbnailWidth}"></div>
      <div class="links">
        <span v-if="entity?.wikidata" class="logo" title="Wikipedia">
          <a target="_blank" :href="entity.wikipedia">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/77/Wikipedia_svg_logo.svg"/>
          </a>
        </span>
        <span class="logo" title="Wikidata">
          <a target="_blank" :href="`https://www.wikidata.org/entity/${entity?.id}`">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Wikidata-logo.svg"/>
          </a>
        </span>
      </div>
      <p v-if="entity?.summaryText" class="summary" v-html="unwrap(entity.summaryText)"></p>
    </div>

</template>
  
<script setup lang="ts">

  import { computed, ref, toRaw, watch } from 'vue'
  import { getEntity, getSummaryText } from '../utils'

  const props = defineProps({
    qid: { type: String, required: true }
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  const qid = ref<string>(props.qid)
  const entity = ref<any>()

  const backgroundImage = computed(() => entity.value?.thumbnail && `url('${encodeUrl(entity.value.thumbnail)}')`)
  const thumbnailWidth = computed(() => `${host.value.clientWidth * .33}px`)

  watch(host, () => init())
  
  function init() {
    _getEntity()
  }

  async function _getEntity() {
    if (!entity.value || entity.value.id !== props.qid) {
      let _entity:any = await getEntity(qid.value)
      let summaryText = await getSummaryText(qid.value)
      if (summaryText) _entity = {..._entity, summaryText}  
      entity.value = _entity
    }
  }

  function encodeUrl(url:string) {
    let parts = url.split('/')
    let encoded = `${parts.slice(0,-1).join('/')}/${encodeURIComponent(parts[parts.length-1])}`
    return encoded
  }

  function unwrap(html:string) {
    let inner = new DOMParser().parseFromString(html, 'text/html')
    return inner.children[0].children[1].children[0].innerHTML
  }

</script>

<style>

  * { box-sizing: border-box; }

  :host {
    display:inline-block;
    width: 100%;
  }

  .card {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto auto 1fr auto;
    border: 1px solid #444;
    border-radius: 6px;
    min-height: 150px;
    background-color: white;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
  }

  .label, .description, .summary, .links {
    margin: 6px;
    font-size: 1rem;
  }

  .label {
    grid-area: 1 / 1 / 2 / 2;
    font-size: 130%;
    font-weight: bold;
  }

  .description {
    grid-area: 2 / 1 / 3 / 2;
    font-size: 110%;
    font-weight: 400;
  }

  .summary {
    grid-area: 3 / 1 / 4 / 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
    overflow: hidden;
    line-height: 1.2rem;
    font-weight: 300;
  }

  .spacer {
    grid-area: 4 / 1 / 5 / 2;
    height: 100%
  }

  .links {
    grid-area: 5 / 1 / 6 / 2;
  }

  .image {
    grid-area: 1 / 2 / 6 / 3;
    height: 100%;
    object-fit: cover;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }

  .logo img {
    height: 24px;
    margin-right: 12px;
    cursor: pointer;
  }

</style>