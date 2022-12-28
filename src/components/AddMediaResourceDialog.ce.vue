<template>

  <div ref="root" class="main">
    <sl-dialog id="add-media-resource-dialog" label="Add Media Resource">
      
      <form :style="{display: file?.name ? 'grid' : 'none'}" id="add-media-resource-form" class="input-validation-pattern">
        <div :style="{height: `${file?.name ? 120 : 0}px`}">
          <img id="img" :style="{paddingLeft: '16px', height: '100%'}"/>
        </div>

        <div class="fields">
          <sl-input autocomplete="off" id="resource-folder" placeholder="Folder" pattern="^[A-z0-9\/\-_]+$"></sl-input>
          <sl-input autocomplete="off" required id="resource-name" placeholder="Name" pattern="^[A-z0-9\-_ ]+$"></sl-input>
          <sl-input autocomplete="off" id="resource-summary" placeholder="Summary"></sl-input>
        </div>

        <div class="metadata">

          <div class="exif-data">
            <ul>
              <li v-for="val, key, idx in exifData" :key="`exif-${idx}`">
                <span class="label" v-html="key"></span>
                <span class="value" v-html="val"></span>
              </li>
            </ul>
          </div>

          <div class="depicted">
            <div class="search">
              <div>Entities:</div>
              <ve-wikidata-search @entity-selected="onEntitySelected"></ve-wikidata-search></div>
            <ul>
              <li v-for="entity in depicted" :key="entity.id" :data-entity="entity.id">
                <span class="entity-label" v-html="entity.label"></span>
                <span class="entity-description" v-html="entity.description || ''"></span>
                <sl-icon-button class="remove-entity" @click="removeEntity(entity.id)" id="remove-icon" name="trash" label="Remove entity"></sl-icon-button>
              </li>
            </ul>
          </div>

        </div>

        <div class="buttons">
          <sl-button @click="close">Cancel</sl-button>
          <sl-button type="submit" variant="primary">Add</sl-button>
        </div>

      </form>
      <input :style="{display: file?.name ? 'none' : 'block'}" id="filePicker" type="file" accept="image/x-png,image/jpeg,image/gif" @change="fileSelected"/>

    </sl-dialog>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, ref, watch } from 'vue'
  import exifr from 'exifr'
  import { GithubClient } from '../gh-utils'
  import yaml from 'js-yaml'

  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
  import '@shoelace-style/shoelace/dist/components/button/button.js'
  import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
  import '@shoelace-style/shoelace/dist/components/input/input.js'
  import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'
  import type SlInput from '@shoelace-style/shoelace/dist/components/input/input.js'
  import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js'

  defineExpose({ isOpen, show }) // Expose resource for external use

  const props = defineProps({
    path: { type: String, required: true },
    show: { type: Boolean }
  })

  const authToken = ref<string>('')
  const githubClient = ref<any>()
  const acct = ref<string>()
  const repo = ref<string>()
  const branch = ref<string>()
  const pathElems = ref<string[]>([])
  const dialog = ref<SlDialog>()
  const file = ref<File>()
  // const fileName = ref<string>()
  const fileExtension = ref<string>()
  const form = ref<HTMLFormElement>()
  const folder = ref<SlInput>()
  const name = ref<SlInput>()
  const summary = ref<SlInput>()
  const image = ref<HTMLImageElement>()
  const filePicker = ref<HTMLInputElement>()
  const exifData = ref<any>({})
  const depicted = ref<any[]>([])

  const open = ref(false)

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  watch(host, () => init())

  watch(open, () => {
    if (dialog.value) dialog.value.open = open.value
  })

  watch(authToken, () => {
    githubClient.value = new GithubClient(authToken.value)
  })

  watch(file, () => {
    githubClient.value = new GithubClient(authToken.value)
  })

  function init() {
    let token = window.localStorage.getItem('gh-auth-token') || window.localStorage.getItem('gh-unscoped-token')
    if (token) authToken.value = token
    parseContentPath()
    dialog.value = shadowRoot.value?.querySelector('#add-media-resource-dialog') as SlDialog
    dialog.value.addEventListener('sl-hide', () => hideDialog())
    form.value = shadowRoot.value?.querySelector('#add-media-resource-form') as HTMLFormElement
    folder.value = shadowRoot.value?.querySelector('#resource-folder') as SlInput;
    folder.value.value = pathElems.value.join('/')
    name.value = shadowRoot.value?.querySelector('#resource-name') as SlInput;
    summary.value = shadowRoot.value?.querySelector('#resource-summary') as SlInput;
    image.value = shadowRoot.value?.querySelector('#img') as HTMLImageElement
    filePicker.value = shadowRoot.value?.querySelector('#filePicker') as HTMLInputElement
    if (props.show) showDialog()
  }

  function parseContentPath() {
    let [_path, _args] = props.path.split(':').pop()?.split('?') || []
    let qargs = _args ? Object.fromEntries(_args.split('&').map(arg => arg.split('='))) : {}
    let _pathElems = _path.split('/').filter(pe => pe)
    if (_pathElems.length > 0) acct.value = _pathElems[0]
    if (_pathElems.length > 1) repo.value = _pathElems[1]
    if (_pathElems.length > 2) pathElems.value = _pathElems.slice(2)
    if (qargs.ref) branch.value = qargs.ref || 'main'
  }

  function hideDialog() {
    if (folder.value) folder.value.value = pathElems.value.join('/')
    if (name.value) name.value.value = ''
    file.value = undefined
    if (filePicker.value) filePicker.value.value = ''
    open.value = false
  }

  async function showDialog() {
    let _form = form.value
    if (_form) {
      if (!_form.onclick) {
        _form.onclick = function () { }
        _form.addEventListener('submit', async (evt) => {
          evt.preventDefault()
          console.log(`Add resource: folder="${folder.value?.value}" name="${name.value?.value}" summary="${summary.value?.value}"`)
          let metadata = await getMetadata()
          const reader = new FileReader()
          reader.onloadend = async () => {
            const binaryString = reader.result 
            let fileName = name.value?.value.trim().replace(/ /g, '_')
            if (folder.value) {
            let path = [...folder.value?.value.split('/').filter((pe:string) => pe), ...[fileName]].join('/')
              await githubClient.value.putFile(acct.value, repo.value, `${path}.${fileExtension.value}`, binaryString, branch.value, true)
              if (Object.keys(metadata).length > 0)
                await githubClient.value.putFile(acct.value, repo.value, `${path}.yaml`, yaml.dump(metadata), branch.value);
              open.value = false
            }
          }
          if (file.value) reader.readAsBinaryString(file.value)
        })
      }
      open.value = true
    }
  }

  function removeEntity(entityId:string) {
    depicted.value = depicted.value.filter(entity => entity.id !== entityId)
  }

  function onEntitySelected(event: CustomEvent) {
    depicted.value = [...depicted.value, ...[event.detail[0]]]
  }

  function isOpen() {
    return open.value
  }

  function fileSelected() {
    if (filePicker.value?.files && filePicker.value.files.length > 0) {
      file.value = filePicker.value.files[0]
      let parts: string[] = file.value.name.split('.')
      fileExtension.value = parts.slice(-1)[0].toLowerCase()
      let urlCreator = window.URL || window.webkitURL
      if (image.value) {
        image.value.onload = () => getExifTags().then((data:any) => {exifData.value = data})
        image.value.src = urlCreator.createObjectURL(file.value)
      }
      setTimeout(() => (shadowRoot.value?.querySelector('#resource-name') as HTMLInputElement).focus(), 100)
    }
  }

  async function getMetadata() {
    let metadata: any = {}
    if (summary.value) metadata.summary = summary.value.value.trim()
    let depicted = shadowRoot.value
      ? (Array.from(shadowRoot.value.querySelectorAll('.depicted [data-entity]')) as HTMLElement[]).map(el => el.dataset.entity)
      : []
    if (depicted.length > 0) metadata.depicts = depicted
    let exifTags: any = await getExifTags()
    if (exifTags) metadata = {...metadata, ...exifTags}
    return metadata
  }

  async function getExifTags() {
    let tags = await exifr.parse(image.value?.src, true)
    let data:any = {}

    if (tags.CreateDate) data.created = tags.CreateDate.toISOString()

    let orientation = await exifr.orientation(image.value?.src)
    if (orientation) data.orientation = orientation

    let gps = await exifr.gps(image.value?.src)
    if (gps) {
      let {latitude, longitude} = gps
      if (latitude) data.location = `${latitude.toFixed(7)},${longitude.toFixed(7)}`
    }

    return data
  }

  function close() {
    open.value = false
  }

  function show(_show:boolean) {
    if (_show) showDialog()
    else hideDialog()
  }

</script>

<style>

  :host {
    font-family: Roboto, sans-serif;
  }

  * { box-sizing: border-box; }

  input[type=file] {
    font-size: 1.2rem;
  }

  form {
    margin: 12px;
  }
  form > * {
  }

  form .buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  sl-dialog::part(body) {
    /* overflow: unset; */
  }

  form {
    display: grid;
    height: 60vh;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
    margin: 0;
    gap: 12px;
  }
  .metadata {
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    margin: 0;;
  }
  .exif-data ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .label {
    font-weight: bold;
    margin-right: 12px;
  }
  .label::after {
    content: ':';
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .search div {
    font-size: 1.1rem;;
    font-weight: bold;
  }

  ve-wikidata-search {
    width: 100%;
  }

  .depicted {
    margin-top: 12px;
  }
  .depicted ul {
    list-style: none;
    margin: 12px 0;
    padding: 0;
    width: 95%;
  }

  .depicted ul li {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 9px;
    width: 100%;
  }
  .entity-label {
    width: 30%;
  }
  .entity-description {
    width: 50%;
  }
  .remove-entity {
    margin-left: auto;
  }

  .value {
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
  }

</style>