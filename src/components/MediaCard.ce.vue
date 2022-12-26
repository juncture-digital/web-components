<template>

  <div ref="root" class="card" v-if="manifest">
          
    <div class="card-title" v-html="label(manifest)"></div>
    
    <div class="card-image"
      :style="{
        backgroundImage: `url(${thumbnail(manifest)})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'center'
      }"
      @click="toggleShowDialog"
    ></div>
    
    <div class="card-metadata">
      <ul>
        <li v-for="md in metadata">
          <span class="md-label" v-html="md.label"></span>
            <span v-if="md.value.length === 1" class="md-value" v-html="md.value[0]" @click="copyTextToClipboard(md.value)"></span>
            <ul v-else>
              <li v-for="val in md.value">
                <span class="md-value" v-html="val" @click="copyTextToClipboard(val)"></span>
              </li>
            </ul>
        </li>
      </ul>
    </div>

    <div class="card-abstract" v-html="summary(manifest)"></div>

    <div class="card-links">
      <img @click="copyTextToClipboard(manifest.id)" src="https://juncture-digital.github.io/web-app/static/iiif.png" alt="IIIF manifest icon"/>
    </div>

    <sl-dialog ref="dialog" id="image-dialog" no-header style="--body-spacing:0;--footer-spacing:0;">
      <ve-media v-if="showDialog" :manifest="manifest.id" zoom-on-scroll></ve-media>
      <sl-button slot="footer" class="close" @click="toggleShowDialog" variant="primary">Close</sl-button>
    </sl-dialog>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, ref, toRaw, watch } from 'vue'
  import { getItemInfo, getManifest, getMetadata, label, summary, thumbnail } from '../utils'

  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import type SLDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js'

  const props = defineProps({
    manifest: { type: String, required: true }
  })

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

  const dialog = ref<SLDialog>()
  watch(dialog, (_dialog) => {
    _dialog?.addEventListener('sl-show', () => {
      if (dialog.value) dialog.value.panel.style.width = `${calcDialogWidth()}px`
    })
  })

  const showDialog = ref(false)
  watch(showDialog, () => { showDialog.value ? dialog.value?.show() : dialog.value?.hide() })

  function toggleShowDialog() {
    showDialog.value = !showDialog.value
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

</script>

<style>

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

  .card {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
    border: 0.5px solid #ddd;
    border-radius: 4px;
    padding: 0;
    height: 100%;
    width: 100%;
  }

  .card p {
    border: none;
  }

  .card-image {  /* image */
    grid-area: 1 / 1 / 2 / 2;
    width: 100%;
    height: 244px;
    cursor: pointer;
  }

  .card-title {  /* title */
    grid-area: 2 / 1 / 3 / 2;
    font-weight: bold;
    font-size: 1.3rem;
    line-height: 1;
    padding: 1.3rem .5rem .2rem .5rem;
    text-decoration: none;
  }

  .card-metadata {  /* metadata list */
    grid-area: 3 / 1 / 4 / 2;
    list-style: none;
    padding: 1rem 0.5rem;
    margin: 0;
    font-size: 0.9rem;
    font-weight: 400;
    max-height: 260px;
    overflow-y: scroll;
  }

  .card-metadata ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .card-links { 
    grid-area: 4 / 1 / 5 / 2;
    display: flex;
    gap: 9px;
    align-items: center;
    align-self: flex-end;
    padding: .2rem .5rem;
    margin: 0;
    font-size: 0.9rem;
    font-weight: 400;
  }

  .card-links a {
    height: 24px;
  }
  .card-links img {
    height: 24px;
    cursor: pointer;
  }
  .card-links sl-icon {
    font-size: 20px;
    color: #999;;
  }

  .card-abstract{  /* abstract */
    grid-area: 5 / 1 / 6 / 2;
    align-self: flex-start;
    height: 110px;
    line-height: 1.4;
    font-size: 0.9em;
    padding: .5rem .5rem 0 .5rem;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    margin: 0 0 .5rem 0;
  }

  .md-label {
    font-weight: bold;
    margin-right: 6px;
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

</style>