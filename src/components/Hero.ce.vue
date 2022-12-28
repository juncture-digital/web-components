<template>

  <section ref="root" class="ve-hero">
    <sl-tooltip content="Show image info">
      <sl-icon id="info-icon" name="info-circle-fill" @click="showInfoPopup" title="Image info"></sl-icon>
    </sl-tooltip>
    <div id="image-info-popup"></div>
  </section>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { getManifest, imageDataUrl, getItemInfo, parseImageOptions } from '../utils'

  import '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'

  const props = defineProps({
    background: { type: String },
    options: { type: String },
    position: { type: String, default: 'center' },
    sticky: { type: Boolean, default: false },
    height: { type: Number, default: 300 },
    top: { type: Number, default: 0 },
  })
  
  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  const manifest = ref<any>()
  const imageOptions = ref<any>()
  const imageInfo = ref<any>()
  const imgUrl = ref<string>()

  watch(props, () => { 
    if (props.sticky) {
      host.value.style.position = 'sticky'
      host.value.style.top = '-320px'
    } 
  })

  watch(host, () => {
    // console.log(toRaw(host.value))
    imageOptions.value = parseImageOptions(props.options || '')
    if (props.background) getManifest(props.background).then(_manifest => manifest.value = _manifest)
    host.value.style.height = `${props.height}px`
    if (props.sticky) host.value.style.position = 'sticky'
    if (props.top) host.value.style.top = `-${props.top}px`
  })

  watch(manifest, (val: object, priorVal: object) => {
    if (val !== priorVal) imageInfo.value = getItemInfo(val)
  })

  watch(imageInfo, async (val: any, priorVal: any) => {
    if (val !== priorVal) {
      imgUrl.value = val.service
        ? iiifUrl(val.service[0].id || val.service[0]['@id'], imageOptions.value)
        : await imageDataUrl(imageInfo.value.id, imageOptions.value.region, {width: host.value.clientWidth, height: props.height})
    }
  })

  watch(imgUrl, () => {
    host.value.style.backgroundImage = `url("${imgUrl.value}")`
    host.value.style.backgroundPosition = props.position
  })

  function iiifUrl(serviceUrl: string, options: any) {
    let size = `${host.value.clientWidth},`
    let url = `${serviceUrl.replace(/\/info.json$/,'')}/${options.region}/${size}/${options.rotation}/${options.quality}.${options.format}`
    return url
  }

  function showInfoPopup() {
    let popup: HTMLElement = host.value.shadowRoot.querySelector('#image-info-popup')
    let images = encodeURIComponent(JSON.stringify([{manifest: manifest.value}]))
    popup.innerHTML = `<ve-manifest images="${images}" condensed></ve-manifest>`
    popup.style.display = popup.style.display === 'block' ? 'none' : 'block'
  }

</script>

<style>

  * { box-sizing: border-box; }

  :host {
    display: block;
    position: relative;
    width: 100%;
  }

  .ve-hero {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    z-index: 8;
  }

  .hero:hover #info-icon {
    visibility: visible;
  }

  #info-icon {
    visibility: hidden;
    position: absolute;
    right: 10px;
    top: 10px;
    color: white;
    background: black;
    border-radius: 50%;
    border: 1px solid black;
  }

  #info-icon::part(base) {
    background-color: inherit;  
  }

  #info-icon:hover {
    cursor: pointer;
  }

  #image-info-popup {
    position: absolute;
    display: none;
    width: 75%;
    max-width: 300px;
    height: auto;
    max-height: 500px;
    background: #fff;
    right: 40px; 
    top: 10px;
    padding: 6px;
    border: 1px solid #444;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
    border-radius: 3px;
    overflow-y: scroll;
    z-index: 10;
  }

</style>