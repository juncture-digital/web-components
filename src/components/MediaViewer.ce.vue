<template>
  <div ref="root" id="wrapper" :class="isEditable ? 'edit' : 'view'">
    <div id="content">
      <!-- <div v-if="type === 'image'" id="osd" @click="showModal = !showModal"></div> -->
      
      <div v-if="type === 'image'" id="osd" class="media-item">
        <div v-if="type === 'image'" class="info-icon">
          <a-tooltip placement="bottom">
            <template #title>Click to {{itemsList[0].id === popoverId ? 'Hide' : 'Show'}} Details</template>
            <a-popover trigger="click" :visible="itemsList[0].id === popoverId" :style="`width:${width}px;height${height}px;`" placement="leftTop">
              <template #content>
                <div>
                  <ve-manifest-beta :manifest="itemsList[0].manifest" :width="width" :height="height"></ve-manifest-beta>
                  <a @click="popoverId = null">Close</a>
                </div>
              </template>
              <info-circle-outlined @click="popoverId = popoverId === itemsList[0].id ? null : itemsList[0].id"/>
            </a-popover>
          </a-tooltip>      
        </div>
      </div>

      <div v-else-if="type === 'image-grid'" class="grid-wrapper">
        <div v-for="item, idx in itemsList" class="media-item">
          <img :src="thumbnail(manifests[idx])"/>
          <div class="info-icon">
            <a-popover trigger="click" :visible="item.id === popoverId" style="width:300px;height:400px;" placement="leftTop">
              <template #content>
                <div>
                  <ve-manifest-beta :manifest="item.manifest" ></ve-manifest-beta>
                  <a @click="popoverId = null">Close</a>
                </div>
              </template>
              <info-circle-outlined @click="popoverId = popoverId === item.id ? null : item.id"/>
            </a-popover>
          </div>
        </div>
      </div>

      <video v-else-if="type === 'video'"
        id="html5-player"
        controls
        playsinline
        :muted="props.muted"
        :autoplay="props.autoplay"
      >
        <source :src="src" :type="mime"/>
      </video>

      <sl-image-comparer v-else-if="type === 'image-compare'">
        <img v-for="src, idx in scaleImages()" :key="`img=${idx}`" :src="src" :slot="idx === 0 ? 'before' : 'after'" :alt="label(manifests[idx])"/>
      </sl-image-comparer>

      <!--
      <a-drawer
        title="Annotations"
        placement="left"
        :closable="true"
        :visible="showAnnotations"
        :get-container="false"
        :style="{ position: 'absolute' }"
        @close="showAnnotations = false"
        :headerStyle="{padding: 0}"
      >
        <ul class="annotations">
          <li v-for="anno, idx in annotations" :key="`anno-${idx}`" @mouseover="showAnnotation(anno.id.split('/').pop())">
            <copy-outlined @click="copyTextToClipboard(anno.id.split('/').pop())"/>
            <span class="anno-text" v-html="anno.body[0].value"></span>
          </li>
        </ul>
      </a-drawer>
      -->

    </div>

    <!-- Image navigator -->
    <div v-if="type === 'image'" id="image-navigator">
      <a-pagination :current="currentImage" :pageSize="1" @change="onPageChange" :total="totalImages" hide-on-single-page ></a-pagination>
    </div>
    <!-- Image navigator end -->

    <!-- Caption bar -->
    <div v-if="type === 'image'" id="caption-bar">

      <a-tooltip placement="top">
        <template #title>Click Annotate Image</template>
        <edit-outlined v-if="isEditable" @click="annotator.toggleDrawingEnabled()"/>
      </a-tooltip>      

      <a-tooltip>
        <template #title>{{annotator.visible ? 'Hide' : 'Show'}} Annotations</template>
        <a-badge v-if="annotations.length > 0" :count="annotations.length" title="Show annotations" 
          @click="annotator.toggleVisibility($event)" :number-style="{ backgroundColor:'#FFFF66', color:'#444'}">
          <comment-outlined @click="annotator.toggleVisibility($event)"/>
        </a-badge>
      </a-tooltip>      

      <a-tooltip placement="bottom">
        <template #title>Click to {{itemsList[0].id === popoverId ? 'Hide' : 'Show'}} Details</template>
        <div class="label" v-html="label(manifest)" @click="popoverId = popoverId === itemsList[0].id ? null : itemsList[0].id"></div>
      </a-tooltip>      

    </div>
    <!-- Caption bar end -->

    <div v-if="coords" id="coords" v-html="coords" @click="copyTextToClipboard(coords || '')"></div>

  </div>

  <a-modal
    :bodyStyle="{padding: 0}"
    v-model:visible="showModal" title="Basic Modal" width="40%" @ok="showModal = false">
    <ve-media-beta :manifest="manifest.id" :idx="currentImage" :base="props.base" width="100%"></ve-media-beta>
  </a-modal>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue'
  import OpenSeadragon from 'openseadragon'
  import { getItemInfo, imageCount, loadManifests, label, parseRegionString, sha256, thumbnail } from '../utils'
  import { Annotator } from '../annotator'

  // https://antdv.com/components/overview
  import { CommentOutlined, EditOutlined, CopyOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
  import 'ant-design-vue/dist/antd.css'

  import { Badge as ABadge } from 'ant-design-vue'
  import { Drawer as ADrawer } from 'ant-design-vue'
  import { Modal as AModal } from 'ant-design-vue'
  import { Pagination as APagination } from 'ant-design-vue'
  import { Popover as APopover } from 'ant-design-vue'
  import { Tooltip as ATooltip } from 'ant-design-vue'

  import SLImageComparer from '@shoelace-style/shoelace/dist/components/image-comparer/image-comparer.js'

  const props = defineProps({
    manifest: { type: String },
    seq: { type: Number, default: 1 },
    base: { type: String },
    region: { type: String },
    size: { type: String },
    rotation: { type: String },
    quality: { type: String },
    format: { type: String },
    editable: { type: Boolean, default: false },
    options: { type: String },
    alt: { type: String },
    caption: { type: String },
    fit: { type: String },
    entities: { type: String },

    // Multiple display options
    grid: { type: Boolean, default: false },
    cards: { type: Boolean, default: false },
    compare: { type: Boolean, default: false },

    // Positioning props
    position: { type: String },
    full: { type: Boolean, default: false },
    left: { type: Boolean, default: false },
    right: { type: Boolean, default: false },
    sticky: { type: Boolean, default: false },
    width: { type: String },
    height: { type: String },

    // Video props
    autoplay: { type: Boolean, default: false },
    muted: { type: Boolean, default: true },
    start: { type: String },
    end: { type: String },

    class: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  const showModal = ref<boolean>(false)
  // const showAnnotations = ref<boolean>(false)
  const annotator = ref<any>()

  let loadedImageId: string

  function onImageLoaded() {
    let item = itemsList.value[0]
    let imageId = sha256(itemInfo.value.id || itemInfo.value['@id']).slice(0,8)
    if (imageId !== loadedImageId) {
      annotator.value.loadAnnotations(imageId).then((annos: any[]) => annotations.value = annos)
      if (!loadedImageId && item.seq === currentImage.value && item.region) viewer.value?.viewport.fitBounds(parseRegionString(item.region, viewer.value), true)
      // if (item.region) setTimeout(() => viewer.value?.viewport.fitBounds(parseRegionString(item.region, viewer.value), true), 1)
      loadedImageId = imageId
    }
  }

  let viewer = ref<OpenSeadragon.Viewer>()
  watch(viewer, () => {
    if (viewer.value) {
      let osdViewer = viewer.value
      setTimeout(() => setViewportCoords(), 100)
      osdViewer.addHandler('viewport-change', () => watchCoords())
      annotator.value = new Annotator(osdViewer, props.base, isEditable.value)

      let tiledImage = osdViewer.world.getItemAt(0)
      if (tiledImage) {
        if (tiledImage.getFullyLoaded()) onImageLoaded()
        else tiledImage.addHandler('fully-loaded-change', (evt) => { if (evt.fullyLoaded) onImageLoaded()})
      } else {
          osdViewer.world.addHandler('add-item', () => {
          let tiledImage = osdViewer.world.getItemAt(0)
          if (tiledImage.getFullyLoaded()) onImageLoaded()
          else tiledImage.addHandler('fully-loaded-change', (evt) => { if (evt.fullyLoaded) onImageLoaded() })
        })
      }
    }
  })

  let coordsDebounce: any = null
  function watchCoords() {
    if (coordsDebounce !== null) {
      clearTimeout(coordsDebounce)
      coordsDebounce = null
    }
    coordsDebounce = window.setTimeout(() => setViewportCoords(), 100)
  }

  function setViewportCoords() {
    const tiledImage = viewer && viewer.value?.world.getItemAt(0)
      if (tiledImage) {
        let bounds = viewer.value?.viewport.getBounds()
        const imageBounds = bounds ? tiledImage.viewportToImageRectangle(bounds) : null
        coords.value = imageBounds
          ? `${Math.ceil(imageBounds.x)},${Math.ceil(imageBounds.y)},${Math.ceil(imageBounds.width)},${Math.ceil(imageBounds.height)}`
          : ''
      }
  }

  const coords = ref<string>()
  const annotations = ref<any[]>([])

  const currentImage = ref(props.seq)
  const totalImages = ref(props.seq)
  function onPageChange(newpage:number) { currentImage.value = newpage }

  const width = ref<number>(0)
  const height = ref<number>(0)
  const aspect = ref<number>(0)

  const itemsList = ref(<any[]>[])
  const manifests:any = ref([])
  const manifest:any = ref(null)
  const itemInfo:any = ref(null)
  const type:any = ref(null)
  const tileSource:any = ref(null)

  const popoverId:any  = ref(null)

  watch(host, () => {
    itemsList.value = buildItemsList()
  })
  watch(itemsList, () => {
    let manifestUrls = itemsList.value.map(item => item.manifest)
    loadManifests(manifestUrls).then(resp => {
      manifests.value = resp
      if (manifests.value.length > 1)
      type.value = manifests.value.length === 2 ? 'image-compare' : 'image-grid'
    })
  })

  watch(manifests, () => manifest.value = manifests.value.length > 0 && manifests.value[0])
  watch(manifest, () => {
    totalImages.value = imageCount(manifest.value)
    itemInfo.value = manifest.value ? getItemInfo(manifest.value, currentImage.value) : null
  })
  watch(currentImage, () => itemInfo.value = manifest.value ? getItemInfo(manifest.value, currentImage.value) : null)

  const isEditable = computed(() => {
    return props.editable === true || window.location.pathname.indexOf('/editor') === 0
  })

  const src = computed(() => itemInfo.value.id)
  const mime = computed(() => {
    let fileExtension = src.value?.split('#')[0].split('.').pop()
    return fileExtension === 'mp4'
      ? 'video/mp4'
      : fileExtension === 'webm'
        ? 'video/webm'
        : 'application/ogg'
  })

  watch(itemInfo, () => {
    type.value = type.value || itemInfo.value?.type?.toLowerCase()
    tileSource.value = type.value &&
      type.value=== 'image'
      ? itemInfo.value.service
        ? `${itemInfo.value.service[0].id || itemInfo.value.service[0]['@id']}/info.json`
        : { url: itemInfo.value.id, type: 'image', buildPyramid: true }
      : null
    viewer.value && viewer.value.open(tileSource.value)
    if (!width.value) doLayout()
  })

  watch(type, () => {
    nextTick(() => {
      if (type.value === 'audio') loadAudio()
      else if (type.value === 'image') loadImage()
      else if (type.value === 'video') loadVideo()
    })
  })

  const iiifRegex = RegExp(/^(?<region>(pct:)?([0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+)|full|square)(\/(?<size>full|max|((pct:)?[\d,.!]+)))?(\/(?<rotation>!?\d+))?(\/(?<quality>color|gray|bitonal|default))?(\/(?<format>jpg|tif|png|gif|jp2|pdf|webp))?/)

  function isIiifArg(str:string) {
    return iiifRegex.test(str)
  }

  function isInt(str:string) {
    return /^[0-9]+$/.test(str)
  }

  function buildItemsList() {
    if (props.manifest) {
      let obj:any = {
        id: sha256(props.manifest).slice(0,8),
        manifest: props.manifest
      }
      obj.seq = props.seq
      obj.region = props.region
      obj.size = props.size
      obj.rotation = props.rotation
      obj.quality = props.quality
      obj.format = props.format
      obj.fit = props.fit
      return [obj]
    } else {
      let itemsList = Array.from(host.value.querySelectorAll('li') as HTMLUListElement[]).map(li => {
        let tokens:string[] = []
        let s = li.textContent?.replace(/“/,'"').replace(/”/,'"').replace(/’/,"'").trim()
        s?.match(/[^\s"]+|"([^"]*)"/gmi)?.forEach(token => {
          if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
          else tokens.push(token)
        })
        let obj:any = {
          id: sha256(tokens[0]).slice(0,8),
          manifest: tokens[0]
        }
        for (let i = 1; i < tokens.length; i++) {
          let token = tokens[i]
          if (token.indexOf('=') > 0) {
            let split = token.split('=')
            obj[split[0]] = split[1]
          } else if (isInt(token)) {
            obj.seq = token
          } else if (isIiifArg(token)) {
            let match = token.match(iiifRegex)
            if (match) obj = {...obj, ...match.groups}
          } else if (token === 'cover' || token === 'contain') {
            obj.fit = token
          } else {
            obj.caption = token[0] === '"' && token[token.length-1] === '"' ? token.slice(1,-1) : token
          }
        }
        return obj
      })
      return itemsList
    }
  }

  function scaleImages() {
    let targetWidth = width.value
    let targetHeight = height.value
    let targetAspectRatio = aspect.value

    return itemsList.value.map((img, idx) => {
      
      let x,y,w,h
      if (img.region) [x,y,w,h] = img.region.split(',').map((s:string) => parseInt(s))

      let imgInfo = getItemInfo(manifests.value[idx])
      const inputWidth = w || imgInfo.width
      const inputHeight = h || imgInfo.height
      const inputImageAspectRatio = Number((inputWidth/inputHeight).toFixed(4))

      let outputWidth = inputWidth
      let outputHeight = inputHeight

      if (inputImageAspectRatio > targetAspectRatio) {
        outputWidth = Math.round(inputHeight * targetAspectRatio)
        outputHeight = Math.round(outputWidth / targetAspectRatio)
      } else {
        outputHeight = Math.round(inputWidth / targetAspectRatio)
        outputWidth = Math.round(outputHeight * targetAspectRatio)
      }

      let tileSource = imgInfo.service[0].id || imgInfo.service[0]['@id']

      // console.log(`${tileSource}: ${inputWidth}x${inputHeight} ${outputWidth}x${outputHeight} ${Number((outputWidth/outputHeight).toFixed(4))}`)

      const outputX = (x || 0) + Math.abs(Math.round((outputWidth - inputWidth) * 0.5))
      const outputY = (y || 0) + Math.abs(Math.round((outputHeight - inputHeight) * 0.5))

      let region = `${outputX},${outputY},${outputWidth},${outputHeight}`

      let imgUrl = `${tileSource}/${region}/${targetWidth},${targetHeight}/${img.rotation || 0}/${img.quality || 'default'}.${img.format || 'jpg'}`

      return imgUrl
    })
  }

  let position = ref(props.right ? 'right' : props.left ? 'left' : 'full')
  
  function doLayout() {
    let wrapper = shadowRoot?.value?.querySelector('#wrapper') as HTMLElement
    let contentContainer = shadowRoot?.value?.querySelector('#content') as HTMLElement

    aspect.value = Number((itemInfo.value.width/itemInfo.value.height).toFixed(4))

    wrapper.classList.add(position.value)
    host.value.classList.add('ve-component')
    host.value.classList.add(position.value)
    if (props.sticky) host.value.classList.add('sticky')

    // wrapper.style.width = props.width || (position.value === 'full' ? '100%' : '50%')
    wrapper.style.width = props.width || '100%'
    width.value = parseInt(window.getComputedStyle(contentContainer).width.slice(0,-2))   
      
    contentContainer.style.height = props.height || (
      type.value === 'image-grid'
        ? '100%'
        : type.value === 'audio'
          ? '200px'
          : `${Math.round(width.value / aspect.value)}px`)
    height.value = parseInt(window.getComputedStyle(contentContainer).height.slice(0,-2)) || (aspect.value >= 1 ? Math.round(width.value / aspect.value) : Math.round(width.value * aspect.value))  
    
    if (position.value === 'full' && (props.compare || props.sticky)) {
      let maxHeight = Math.round(window.innerHeight * .5)
      if (height.value > maxHeight) {
        height.value = maxHeight
        contentContainer.style.height = `${height.value}px`
        contentContainer.style.width = `${Math.round(height.value / aspect.value)}px`
        // contentContainer.style.margin = 'auto'
        // contentContainer.classList.add('shadow')
      }
    }

    // console.log(`doLayout: position=${position.value} width=${width.value} height=${height.value} aspect=${aspect.value}`)
  }

  function loadImage() {
    console.log('loadImage', toRaw(itemInfo.value))
    viewer.value = initOsdViewer()
    tileSource.value && viewer.value.open(tileSource.value)
  }

  function loadVideo() {
    console.log('loadVideo', itemInfo)
  }

  function loadAudio() {
    console.log('loadAudio', itemInfo)
  }

  onMounted(async () => {
    // props.manifest && loadManifests(itemsList.value.map(item => item.manifest)).then(resp => manifests.value = resp)
  })

  function initOsdViewer() {
    let shadowRoot: any = root.value?.parentNode
    let container = shadowRoot.querySelector('#osd')
    const osdOptions: OpenSeadragon.Options = {
      element: container,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      homeFillsViewer: true,
      showNavigationControl: true,
      minZoomImageRatio: 1,
      maxZoomPixelRatio: 10,
      showRotationControl: true,
      showHomeControl: true,
      showZoomControl: true,
      showFullPageControl: true,
      showNavigator: false,
      sequenceMode: true,
      showReferenceStrip: true,
      
      animationTime: 0.5,
      springStiffness: 10,
      
      visibilityRatio: 1.0,
      constrainDuringPan: true
      
    }
    return OpenSeadragon(osdOptions)
  }

  function copyTextToClipboard(text: string) {
    if (navigator.clipboard) navigator.clipboard.writeText(text)
  }

  function showAnnotation(annoId:string) {
    annotator.value.select(annoId)
  }

</script>

<style>

  @import 'ant-design-vue/lib/badge/style';
  @import 'ant-design-vue/lib/drawer/style';
  @import 'ant-design-vue/lib/pagination/style';
  @import '../annotator/annotorious.css';

  * { box-sizing: border-box; }

  #wrapper {
    position: relative;
    overflow: hidden;
    height: 100%;
    /* box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px; */
  }

  #content {
    position: relative;
    width: 100%;
  }

  #osd, video {
    width: 100%;
    height: 100%;
  }

  #caption-bar {
    display: flex;
    gap: 6px;
    width: 100%;
    align-items: center;
    height: 32px;
    background-color: #555;
  }

  #caption-bar .label {
    color: white;
    padding: 0 9px;
    font-size: 1.1rem;
    width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    cursor: pointer;
  }

  .grid-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
    grid-gap: 12px;
    align-items: flex-start;
    justify-items: center;
    padding: 12px 0;
    width: 100%
  }

  .grid-wrapper > .caption {
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

  .grid-wrapper img {
    border: 1px solid #ccc;
    box-shadow: 2px 2px 6px 0px  rgba(0,0,0,0.3);
    width: 240px;
    max-width: 100%;
  }

  .anticon {
    display: flex;
    margin: 0 6px;
    border-radius: 50%;
    font-size: 20px;
  }

  .anticon-comment,
  .anticon-edit,
  .anticon-info-circle,
  .anticon-copy {  
    color: white;
  }

  .anticon-comment:hover,
  .anticon-edit:hover,
  .anticon-info-circle:hover,
  .anticon-copy:hover {
    color: black;
    background-color: white;
    /* border: 1px solid white; */
    cursor: pointer;
  }

  .anticon-copy:hover {
    cursor: copy;
  }

  #coords {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-family: sans-serif;
    bottom: 0;
    right: 0;
    width: 130px;
    height: 32px;
    padding: 3px 6px;
    font-size: 0.8rem;
    background-color: rgba(255, 255, 255, 0.5);
    color: black;
    z-index: 2;
    opacity: 0;
    text-align: right;
  }
  #coords:hover {
    visibility: visible;
    opacity: 1;
    transition: all 0.3s ease-in;
    cursor: copy;
  }

  .info-icon span {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 24px;
    z-index: 2;
    opacity: 0;
    border-radius: 50%;
    border: 1px solid white;
    background-color: rgba(0, 0, 0, 0.2);
  }
  .media-item {
    position: relative;
  }
  .media-item:hover .info-icon span {
    visibility: visible;
    opacity: 1;
    transition: all 0.3s ease-in;
    cursor: pointer;
    color: white;
  }

  .info-icon:hover svg {
    fill: black;
  }

  .ant-drawer-content-wrapper {
    width: 50% !important;
  }

  .ant-drawer-content {
    position: absolute;
    bottom: 0;
    height: 50% !important;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
  }

  .ant-drawer-header {
    /* background-color: rgba(255, 255, 255, 0.9); */
  }
  .ant-drawer-header svg {
    fill: black;
    font-size: 16px;
  }
  .ant-drawer-body {
    padding: 0 4px;
  }

  .ant-drawer-mask {
    background-color: unset;
  }

  .full-modal .ant-modal {
    max-width: 100%;
    top: 0;
    padding-bottom: 0;
    margin: 0;
  }
  .full-modal .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: calc(100vh);
  }
  .full-modal .ant-modal-body {
    flex: 1;
    padding: 0;
  }

  .view .r6o-footer {
    display: none;
  }
  .r6o-readonly-comment {
    display: inline;
  }
  .view .r6o-editor, 
  .view .r6o-editor-inner, 
  .view .r6o-widget {
    display: inline-block;
    min-height: unset !important;
  }

  .r6o-tag,
  .comment.editable:nth-of-type(2) {
    display: none !important;
  }
  .edit .r6o-editor {
    width: 216px;
  }


  /** New style for the annotation outlines **/
  svg.a9s-annotationlayer .a9s-selection .a9s-inner,
  svg.a9s-annotationlayer .a9s-annotation .a9s-inner  {
    stroke-width: 3;
    stroke: rgba(255,255,0,1.0);
  }

  ul.annotations {
    list-style: none;
    padding-left: 0;
  }
  .annotations li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
  }

  .annotations li:hover {
    background-color: rgba(255,255,255,0.2);
    cursor: pointer;
  }

  .ant-badge-count {
    margin-right: 6px;
    cursor: pointer;
  }

</style>

