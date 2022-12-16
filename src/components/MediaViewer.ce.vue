<template>
  <div ref="root" id="wrapper" :class="isEditable ? 'edit' : 'view'">
    <div id="content">
      <!-- <div v-if="type === 'image'" id="osd" @click="showModal = !showModal"></div> -->
      <div v-if="type === 'image'" id="osd"></div>

      <video v-if="type === 'video'"
        id="html5-player"
        controls
        playsinline
        :muted="props.muted"
        :autoplay="props.autoplay"
      >
        <source :src="src" :type="mime"/>
      </video>

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

    </div>


    <!-- Image navigator -->
    <div id="image-navigator">
      <a-pagination :current="currentImage" :pageSize="1" @change="onPageChange" :total="totalImages" hide-on-single-page ></a-pagination>
    </div>
    <!-- Image navigator end -->

    <!-- Caption bar -->
    <div v-if="type" id="caption-bar">

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
        <template #title>Click to {{showManifest ? 'Hide' : 'Show'}} Details</template>
        <div class="label" v-html="label(manifest)" @click="showManifest = !showManifest"></div>
      </a-tooltip>      

    </div>
    <!-- Caption bar end -->

    <div id="info-icon">
      <a-tooltip placement="bottom">
        <template #title>Click to {{showManifest ? 'Hide' : 'Show'}} Details</template>
        <a-popover trigger="click"  :visible="showManifest" :style="`width:${width}px;height${height}px;`" placement="leftTop">
          <template #content>
            <div>
              <ve-manifest-beta :manifest="props.manifest" :width="width" :height="height"></ve-manifest-beta>
              <a @click="showManifest = false">Close</a>
            </div>
          </template>
          <info-circle-outlined @click="showManifest = !showManifest"/>
        </a-popover>
      </a-tooltip>      
    </div>

    <div v-if="coords" id="coords" v-html="coords"></div>

  </div>

  <a-modal
    :bodyStyle="{padding: 0}"
    v-model:visible="showModal" title="Basic Modal" width="40%" @ok="showModal = false">
    <ve-media-beta :manifest="manifest.id" :idx="currentImage" :base="props.base" width="100%"></ve-media-beta>
  </a-modal>

</template>
  
<script lang="ts">

import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue'
import OpenSeadragon from 'openseadragon'
import { getItemInfo, imageCount, loadManifests, label, sha256 } from '../utils'
import { Annotator } from '../annotator'

// https://antdv.com/components/overview
import { Badge, Button, Drawer, Modal, Pagination, Popover, Tooltip } from 'ant-design-vue'
import { CommentOutlined, EditOutlined, CopyOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import 'ant-design-vue/dist/antd.css'

export default {
  components: {
    ABadge: Badge,
    AButton: Button,
    ADrawer: Drawer,
    CommentOutlined,
    EditOutlined,
    CopyOutlined,
    InfoCircleOutlined,
    AModal: Modal,
    APagination: Pagination,
    APopover: Popover,
    ATooltip: Tooltip
  },
  props: {
    manifest: { type: String },
    idx: { type: Number, default: 1 },
    base: { type: String },
    editable: { type: Boolean, default: false },
    width: { type: String },
    height: { type: String },
    muted: { type: Boolean, default: true },
    autoplay: { type: Boolean, default: false }
  },
  setup(props) {

    const root = ref<HTMLElement | null>(null)
    
    const showModal = ref<boolean>(false)
    const showAnnotations = ref<boolean>(false)
    const showManifest = ref<boolean>(false)
    const annotator = ref<any>()
  
    function onImageLoaded() {
      let imageId = sha256(itemInfo.value.id || itemInfo.value['@id']).slice(0,8)
      annotator.value.loadAnnotations(imageId).then((annos: any[]) => annotations.value = annos)
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

    const currentImage = ref(props.idx)
    const totalImages = ref(props.idx)
    function onPageChange(newpage:number) { currentImage.value = newpage }

    const width = ref<number>(0)
    const height = ref<number>(0)
    const aspect = ref<number>(0)

    let manifests:any = ref([])
    let manifest:any = ref(null)
    let itemInfo:any = ref(null)
    let tileSource:any = ref(null)

    watch(manifests, () => manifest.value = manifests.value.length > 0 && manifests.value[0])
    watch(manifest, () => {
      totalImages.value = imageCount(manifest.value)
      itemInfo.value = manifest.value ? getItemInfo(manifest.value, currentImage.value) : null
    })
    watch(currentImage, () => itemInfo.value = manifest.value ? getItemInfo(manifest.value, currentImage.value) : null)

    const isEditable = computed(() => {
      return props.editable === true || window.location.pathname.indexOf('/editor') === 0
    })
    const type = computed(() => itemInfo.value?.type?.toLowerCase())
    const src = computed(() => itemInfo.value.id)
    const mime = computed(() => {
      let fileExtension = src.value?.split('#')[0].split('.').pop()
      return fileExtension === 'mp4'
        ? 'video/mp4'
        : fileExtension === 'webm'
          ? 'video/webm'
          : 'application/ogg'
    })

    watch(annotations, () => {
      // console.log(toRaw(annotations.value))
    })

    let annotatorWindow: any
    function openAnnotator() {
      // let url = location.hostname === 'localhost'? 'http://localhost:8080/annotator/' : 'https://beta.juncture-digital.org/annotator'
      let url = 'https://beta.juncture-digital.org/annotator'
      url += `?manifest=${manifest.value.id}`
      url += `&seq=${currentImage}`
      url += `&anno-base=${props.base}`
      // this.openWindow(url, `toolbar=yes,location=yes,left=0,top=0,width=${width+depictsPanelWidth},height=${height+200},scrollbars=yes,status=yes`)
      openWindow(url, `toolbar=yes,location=yes,left=0,top=0,width=1200,height=1000,scrollbars=yes,status=yes`)
    }

    function openWindow(url:string, options:any) {
      if (annotatorWindow) { annotatorWindow.close() }
      if (options === undefined) options = 'toolbar=yes,location=yes,left=0,top=0,width=1000,height=1200,scrollbars=yes,status=yes'
      annotatorWindow = window.open(url, '_blank', options)
    }

    /*
    const tileSource = computed(() => {
      console.log('tiledSource', itemInfo)
      return type.value &&
        type.value=== 'image'
        ? itemInfo.value.service
          ? `${itemInfo.value.service[0].id}/info.json`
          : { url: itemInfo.value.id, type: 'image', buildPyramid: true }
        : null
    })
    */

    watch(itemInfo, () => {
      tileSource.value = type.value &&
        type.value=== 'image'
        ? itemInfo.value.service
          ? `${itemInfo.value.service[0].id}/info.json`
          : { url: itemInfo.value.id, type: 'image', buildPyramid: true }
        : null
      viewer.value && viewer.value.open(tileSource.value)
      if (!width.value) setDimensions()
    })

    watch(type, () => {
      nextTick(() => {
        if (type.value === 'audio') loadAudio()
        else if (type.value === 'image') loadImage()
        else if (type.value === 'video') loadVideo()
      })
    })

    function setDimensions() {
      let shadowRoot: any = root.value?.parentNode
      let wrapper = shadowRoot.querySelector('#wrapper')
      let contentContainer = shadowRoot.querySelector('#content')
      aspect.value = Number((itemInfo.value.width/itemInfo.value.height).toFixed(4))
      // console.log(`setDimensions: type=${type.value} info.width=${itemInfo.value.width} info.height=${itemInfo.value.height} aspect=${aspect.value}`)
      
      wrapper.style.width = props.width || '50%'
      width.value = parseInt(window.getComputedStyle(wrapper).width.slice(0,-2))
      height.value = width.value / aspect.value
      // wrapper.style.width = `${width.value}px`
      contentContainer.style.height = `${height.value}px`
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
      props.manifest && loadManifests([props.manifest]).then(resp => manifests.value = resp)
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
      console.log(`showAnnotation=${annoId}`)
      annotator.value.select(annoId)
    }

    return {
      annotator,
      annotations,
      coords,
      copyTextToClipboard,
      currentImage,
      isEditable,
      height,
      label,
      manifest,
      mime,
      onPageChange,
      openAnnotator,
      props,
      root,
      showAnnotation,
      showAnnotations,
      showManifest,
      showModal,
      src,
      totalImages,
      type,
      width
    }

  }
}

</script>

<style>

  @import 'ant-design-vue/lib/badge/style';
  @import 'ant-design-vue/lib/button/style';
  @import 'ant-design-vue/lib/drawer/style';
  @import 'ant-design-vue/lib/pagination/style';
  @import '../annotator/annotorious.css';

  * { box-sizing: border-box; }

  #wrapper {
    position: relative;
    overflow: hidden;
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

  #info-icon span {
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
  #wrapper:hover #info-icon span {
    visibility: visible;
    opacity: 1;
    transition: all 0.3s ease-in;
    cursor: pointer;
    color: white;
  }
  /*
  #info-icon span:hover {
    font-size: 28px;
    right: 18px;
    right: 18px;
  }
  */

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

