<template>

    <div v-bind="$attrs"></div>
    
    <ve-hero v-if="backgroundIsImage"
      :background="props.background"
      :options="props.options"
      :position="props.position"
      :sticky="props.sticky ? '' : null"
      :height="height"
      :top="sticky ? height - navbarHeight : 0"
    ></ve-hero>

    <ve-navbar ref="navbar"
      :label="props.label"
      :subtitle="props.subtitle"
      :logo="props.logo"
      :url="props.url"
      :sticky="props.sticky ? '' : null"
      :search-domain="props.searchDomain"
      :contact="props.contact"
      :height="backgroundIsImage ? navbarHeight : height"
      :background="backgroundIsImage ? null : (props.background || '#444')"
      :alpha="backgroundIsImage ? 0.2 : 0"
      :offset="backgroundIsImage ? navbarHeight : 0"
    >

      <ul v-if="navEl" v-html="navEl"></ul>

    </ve-navbar>


</template>
  
<script setup lang="ts">

  import { computed, onMounted, onUpdated, ref, toRaw, watch } from 'vue'
  import { isURL, getEntity } from '../utils'
  
  const props = defineProps({
    label: { type: String },
    subtitle: { type: String },
    logo: { type: String },
    url: { type: String },
    contact: { type: String },
    searchDomain: { type: String },
    entities: { type: String },
    sticky: { type: Boolean },
    background: { type: String },
    options: { type: String },
    height: { type: Number },
    position: { type: String }
  })

  const navbarHeight = 80
  const heroHeight = 400
  const manifestShorthandRegex = /^\w+:/

  const navbar = ref<HTMLElement | null>(null)
  const host = computed(() => (navbar.value?.getRootNode() as any)?.host)

  const backgroundIsImage = ref(false)
  const navEl = ref<string>()
  const entities = ref<string[]>([])
  const entity = ref<any>()
  const background = ref<string>()

  const height = computed(() => props.height || (backgroundIsImage.value ? heroHeight : navbarHeight))

  onMounted(() => applyProps() )
  onUpdated(() => applyProps() )

  function applyProps() {
    entities.value = props.entities ? props.entities.split(/\s+/).filter(qid => qid) : []
    backgroundIsImage.value = props.background !== undefined && (isURL(props.background) || isManifestShorthand(props.background))
    if (navbar.value) navbar.value.style.height = `${props.height || navbarHeight}px`
    if (props.sticky) host.value.classList.add('sticky')
    navEl.value = (host.value.querySelector('ul') as HTMLUListElement).innerHTML
  }

  // watch(navEl, () => console.log('header.navEl', navEl.value))

  watch(entities, async () => {
    if (entities.value.length > 0) {
      entity.value = await getEntity(entities.value[0])
      if (entity.value) {
        if (entity.value.pageBanner) {
          background.value = `https://iiif.juncture-digital.org/wc:${decodeURIComponent(entity.value.pageBanner.split('/Special:FilePath/').pop()).replace(/\s/,'_')}/manifest.json`
        }
      }
    }
  })

  function isManifestShorthand(s:string) {
    return manifestShorthandRegex.test(s) 
  }

</script>

<style>

  .main {
    width: 100%;
  }

</style>
