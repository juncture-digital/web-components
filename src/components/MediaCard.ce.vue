<template>

  <div ref="root" v-if="manifest" class="card">
    <div class="card-image"
      :style="{
        backgroundImage: `url(${thumbnailUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'top'
      }"
      @click="toggleShowImageDialog"
    ></div>
    
    <div class="card-title" v-html="label(manifest)"></div>

    <div class="card-abstract" v-html="summary(manifest)"></div>

    <ul class="card-metadata">
      <li v-for="md in metadata">
        <span class="md-label" v-html="md.label"></span>
          <template v-if="md.value.length === 1" >
            <sl-icon-button v-if="md.label === 'location'" name="chat-square-text" label="Show Location" @click="toggleShowMapDialog"></sl-icon-button>
            <span class="md-value" v-html="md.value[0]" @click="copyTextToClipboard(md.value)"></span>
          </template>
          <ul v-else>
            <li v-for="val in md.value">
              <span class="md-value" v-html="val" @click="copyTextToClipboard(val)"></span>
            </li>
          </ul>
      </li>
    </ul>

    <div class="card-links" style="margin-top:auto;">
      <img src="https://juncture-digital.github.io/web-app/static/iiif.png" class="draggable-iiif" alt="IIIF manifest icon"
        @click="copyTextToClipboard(manifest)" 
        @dragstart="onIiifDrag"
      />
    </div>

    <sl-dialog ref="imageDialog" id="image-dialog" no-header style="--body-spacing:0;--footer-spacing:0;">
      <ve-media v-if="showImageDialog" :manifest="manifest.id" zoom-on-scroll></ve-media>
      <sl-button slot="footer" class="close" @click="toggleShowImageDialog" variant="primary">Close</sl-button>
    </sl-dialog>

    <sl-dialog ref="mapDialog" id="map-dialog" no-header style="--body-spacing:0;--footer-spacing:0;">
      <ve-map v-if="showMapDialog" :center="location" :marker="location"></ve-map>
      <sl-button slot="footer" class="close" @click="toggleShowMapDialog" variant="primary">Close</sl-button>
    </sl-dialog>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, onUpdated, ref, toRaw, watch } from 'vue'
  import { getItemInfo, getManifest, getMetadata, label, summary, thumbnail } from '../utils'

  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
  import type SLDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js'

  const props = defineProps({
    manifest: { type: String, required: true }
  })
  const thumbnailUrl = computed(() => `"${thumbnail(manifest.value)}"`)
  
  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  const manifest = ref<any>()
  // watch(manifest, () => console.log(toRaw(manifest.value)))

  const itemInfo = computed(() => manifest.value && getItemInfo(manifest.value))
  // watch(itemInfo, () => console.log(toRaw(itemInfo.value)))

  const dimensions = computed(() => itemInfo.value && `${itemInfo.value.width.toLocaleString()} x ${itemInfo.value.height.toLocaleString()}`)
  // watch(dimensions, () => console.log(toRaw(dimensions.value)))

  const metadata = computed(() => manifest.value && _getMetadata())

  const location = computed(() => {
    let locMd = metadata.value.find((md:any) => md.label.toLowerCase() === 'location')
    return locMd ? `${locMd.value}` : null
  })

  
  onUpdated(() => {
    getManifest(props.manifest).then(resp => manifest.value = resp)
  })

  function _getMetadata(): any[] {
    let dateFields = new Set(['created', 'updated'])
    let exclude = new Set(['image_url', 'size'])
    let _metadata = getMetadata(manifest.value).filter(item => !exclude.has(item.label))
    if (manifest.value.navDate) _metadata.push({label:'navDate', value:[manifest.value.navDate]})
    _metadata.push({label:'dimensions', value:[dimensions.value]})
    _metadata = _metadata
    .map(md => dateFields.has(md.label) ? {label:md.label, value:[md.value[0].split('T')[0]]} : md)
    .map(md => {
      if (md.label === 'source_url') {
        let fileName = md.value[0].split('/').pop()
        md = {label:'source', value:[`<a href="${md.value[0]}" target="_blank">${fileName}</a>`]}
      }
      return md
    })
    return _metadata.sort()
  }

  getManifest(props.manifest).then(resp => manifest.value = resp)

  function copyTextToClipboard(text: string) {
    console.log('copyTextToClipboard', text)
    if (navigator.clipboard) navigator.clipboard.writeText(text)
  }

  const imageDialog = ref<SLDialog>()
  watch(imageDialog, (_dialog) => {
    _dialog?.addEventListener('sl-show', () => {
      if (imageDialog.value) imageDialog.value.panel.style.width = `${calcDialogWidth()}px`
    })
  })

  const showImageDialog = ref(false)
  watch(showImageDialog, () => { showImageDialog.value ? imageDialog.value?.show() : imageDialog.value?.hide() })

  function toggleShowImageDialog() {
    console.log('toggleShowImageDialog')
    showImageDialog.value = !showImageDialog.value
  }

  const mapDialog = ref<SLDialog>()
  watch(mapDialog, (_dialog) => {
    _dialog?.addEventListener('sl-show', () => {
      if (mapDialog.value) mapDialog.value.panel.style.width = `${calcDialogWidth()}px`
    })
  })
  const showMapDialog = ref(false)
  watch(showMapDialog, () => { showMapDialog.value ? mapDialog.value?.show() : mapDialog.value?.hide() })

  function toggleShowMapDialog() {
    console.log()
    showMapDialog.value = !showMapDialog.value
  }

  function calcDialogWidth() {
    let width = Math.round(window.innerWidth - 100)
    let maxHeight = Math.round(window.innerHeight - 150)
    
    let selected = manifest.value
    if (selected) {
      let _imageInfo = getItemInfo(selected)
      let _imageAspect = Number((_imageInfo.width/_imageInfo.height).toFixed(4))
      width = _imageAspect >= 1
        ? width / _imageAspect > maxHeight ? width = maxHeight * _imageAspect : width
        : Math.round(maxHeight * _imageAspect)
    }
    return width
  }

  function onIiifDrag(dragEvent: DragEvent) {
    dragEvent.dataTransfer?.setData('text/uri-list', `${manifest.value.id}?manifest=${manifest.value.id}`)
  }

</script>

<style>

  * { box-sizing: border-box; }

  .buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
  }

  /* The Close Button */
  .close {
    font-size: 14px;
    font-weight: bold;
    padding: 6px;;
  }

  .close:hover,
  .close:focus {
    color: #000;
    text-decoration: none;
    cursor: pointer;
  }



  .md-label {
    font-weight: bold;
    margin-right: 6px;
    color: #444;;
  }

  .md-value {
    display: inline;
    line-height: 1.2rem;
    /* These are technically the same, but use both */
    overflow-wrap: break-word;
    word-wrap: break-word;

    -ms-word-break: break-all;
    /* This is the dangerous one in WebKit, as it breaks things wherever */
    word-break: break-all;
    /* Instead use this non-standard one: */
    word-break: break-word;

    /* Adds a hyphen where the word breaks, if supported (No Blink) */
    -ms-hyphens: auto;
    -moz-hyphens: auto;
    -webkit-hyphens: auto;
    hyphens: auto;
    color: #444;
    cursor: copy;
  }
  .md-value:hover {
    text-decoration: underline;
  }

  .md-label::after {
    content: ":";
  }

  .card-metadata ul ul {
    margin-left: 18px;
  }

  /* Mobile Devices */
  @media (max-width: 480px) {

    .card-image {
      height: 72vw;
    }

  }

  .card {
    display: flex;
    flex-flow: column nowrap;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto 1fr 0px;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;

  }

  .card p {
    border: none;
  }

  .card-image {  /* image */
    align-self: flex-start;
    width: 100%;
    height: 300px;
    cursor: pointer;
  }

  .card-title {  /* title */
    font-weight: bold;
    font-size: 1.5rem;
    line-height: 1;
    padding: 1.3rem .5rem .2rem .5rem;
    text-decoration: none;
    color: #444;
  }

  .card-metadata {  /* metadata list */
    list-style: none;
    padding: .2rem .5rem;
    margin: 12px 0 0 0;
    font-size: 0.9em;
    font-weight: 400;
    max-height: 260px;
    overflow-y: scroll;
  }

  .card-abstract{  /* abstract */
    align-self: flex-start;
    /* min-height: 110px; */
    line-height: 1.4;
    font-size: 0.9em;
    padding: .5rem .5rem 0 .5rem;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    margin: 0 0 .5rem 0;
    -webkit-line-clamp: 8;
  }

  .card-links {
    padding: 6px;
  }
  .card-links img {
    height: 24px;
  }

  .draggable-iiif {
    cursor: grab;
  }

  .clamp5 {
    -webkit-line-clamp: 5;
  }
</style>