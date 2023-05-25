<template>

  <section ref="root" class="ve-navbar" :style="{height: `${props.height}px`}">
    <template v-if="props.logo">
      <a v-if="props.url" :href="props.url"><img :src="props.logo" alt="logo" class="logo"/></a>
      <img v-else :src="props.logo" alt="logo" class="logo"/>
    </template>
    <div class="title-panel">
    <div class="title" v-html="props.label"></div>
      <div v-if="props.subtitle" class="subtitle" v-html="props.subtitle"></div>
    </div>
    <div class="controls">
      <ve-site-search v-if="props.searchDomain" :search-domain="props.searchDomain"></ve-site-search>
      <ve-menu v-if="navEl" :background="props.background" position="right" :contact="props.contact">
        <ul v-html="navEl"></ul>
      </ve-menu>
    </div>
  </section>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, onMounted, onUpdated, ref, toRaw, watch } from 'vue'

  const props = defineProps({
    label: { type: String },
    subtitle: { type: String },
    background: { type: String},
    logo: { type: String },
    url: { type: String },
    alpha: { type: Number },
    contact: { type: String },
    sticky: { type: Boolean, default: false },
    height: { type: Number, default: 80 },
    offset: { type: Number, default: 0 },
    searchDomain: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const shadow = computed(() => root?.value?.parentNode?.querySelector('.ve-navbar') as HTMLElement)

  const navEl = ref<string>()
  // watch(navEl, () => console.log('Navbar.navEl', toRaw(navEl.value)) )

  onMounted(() => {
    applyProps()
    nextTick(() => navEl.value = (host.value.querySelector('ul') as HTMLUListElement)?.innerHTML)
  })

  watch(props, () => applyProps())

  function applyProps() {
    shadow.value.style.height = `${props.height}px`
    if (props.background) host.value.style.backgroundColor = props.background
    if (props.offset) shadow.value.style.marginTop = `-${props.offset}px`
    if (props.sticky) {
      host.value.classList.add('sticky')
      host.value.style.position = 'sticky'
      host.value.style.top = '0'
      if (props.alpha) host.value.style.background = `rgba(0, 0, 0, ${props.alpha})`
      host.value.style.marginTop = `-${props.offset}px`
    }
    if (props.label) {
      let titleEl = document.querySelector('title')
      if (!titleEl) {
        titleEl = document.createElement('title')
        document.head.appendChild(titleEl)
      }
      titleEl.innerText = props.label
    }
  }

</script>

<style>

  * { box-sizing: border-box; } 

  :host, ve-navbar {
    display: block;
    position: relative;
    width: 100%;
    z-index: 10;
  }

  .ve-navbar {
    display: flex;
    width: 100%;
    height: 100%;
    padding: 0;
    align-items: center;
    background-color: inherit;
  }

  /*
  .ve-navbar div:first-of-type {
    margin-left: auto;
  }
  */

  .logo {
    margin-left: 20px;
    background-color: white;
  }
  img.logo {
    max-height: 50px;
  }

  .controls {
    display: flex;
    align-items: center;
    margin-left: auto;
  }

  .title-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-left: 1rem;
  }

  .title, .subtitle {
    color: white;
  }

  .title {
    font-size: 2rem;
    line-height: 1.8rem;
    padding-top: 0;
    font-weight: bold;
  }

  .subtitle {
    font-size: 1.4rem;
  }

  /* Mobile Devices */
  @media (max-width: 480px) {

    .title {
      font-size: 1.6rem;
    }

  }

</style>