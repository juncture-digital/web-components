import { Component, Element, Listen, Prop, h, State, Watch } from '@stencil/core';
import {v4 as uuidv4} from 'uuid'

import { Annotator } from './annotator'

import '@shoelace-style/shoelace/dist/components/image-comparer/image-comparer.js'
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'
import SLDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js'

import './mirador.min.js'
import { defaults } from './config.js'

import { imageInfo, isTouchEnabled, label, loadManifests, makeSticky, parseImageOptions, parseRegionString, sha256, thumbnail } from '../../utils'
import OpenSeadragon from 'openseadragon'

const Mirador:any = (window as any).Mirador

@Component({
  tag: 've-media',
  styleUrl: 've-media.css',
  shadow: false,
})
export class VeMirador {

  @Element() el: HTMLElement;

  @Prop({ mutable: true, reflect: true }) manifest: string
  @Prop({ mutable: true, reflect: true }) seq: number = 1
  @Prop({ mutable: true, reflect: true }) alt: string
  @Prop({ mutable: true, reflect: true }) caption: string

  @Prop() options: string
  @Prop({ mutable: true, reflect: true }) fit: string
  // @Prop() zoomOnScroll: boolean = false

  // Positioning props
  @Prop({ mutable: true, reflect: true }) position: string
  @Prop() width: string
  @Prop() height: string
  @Prop() full: boolean = false
  @Prop() left: boolean = false
  @Prop() right: boolean = false
  @Prop() sticky: boolean

  @Prop() entities: string

  // Display multiple images as gallery
  @Prop() grid: boolean = false
  @Prop() cards: boolean = false

  // Display multiple images in compare mode
  @Prop() compare: boolean = false

  @Prop({ mutable: true, reflect: true }) autostart: boolean = false
  @Prop({ mutable: true, reflect: true }) start: string
  @Prop({ mutable: true, reflect: true }) end: string
  @Prop({ mutable: true, reflect: true }) muted: boolean = true

  @Prop() annoBase: string
  @State() annoPath: string

  @State() id: string
  @State() osd: OpenSeadragon.Viewer = null
  @State() mediaPlayer: HTMLMediaElement
  @State() miradorReady: boolean = false
  @State() mediaType: string = null // image, audio, video
  sourceDimensions: any = {}
  computedDimensions: any

  @State() selectedImage: any
  imageDialogWidth: string
  imageDialogHeight: string

  @State() selected: any = {}
  @State() detailsDialog: any = {}

  annotator: any

  wrapperEl: HTMLElement = null
  miradorEl: HTMLElement = null
  miradorViewer: any = null
  
  // video and audio player state
  isMuted: boolean = false
  isPlaying: boolean = false
  startTimes: any = {}
  timeoutId: any = null
  forceMuteOnPlay: boolean = true

  doInit: boolean = true
  observer: MutationObserver
  osdContainer: HTMLElement

  // used in grid and compare modes
  @State() imageList: any[] = []

  @State() viewportBounds
  @State() debounce: any = null
  getViewportBounds() {
    if (this.debounce !== null) {
      clearTimeout(this.debounce)
      this.debounce = null
    }
    this.debounce = window.setTimeout(() => {
      const tiledImage = this.osd.world.getItemAt(0)
      if (tiledImage) {
        const imageBounds = tiledImage.viewportToImageRectangle(this.osd.viewport.getBounds())
        this.viewportBounds = `${Math.ceil(imageBounds.x)},${Math.ceil(imageBounds.y)},${Math.ceil(imageBounds.width)},${Math.ceil(imageBounds.height)}`
      }
    }, 500)
  }

  @Watch('manifest')
  manifestChanged() {
    this.id = `mirador-${uuidv4().split('-')[0]}`
    if (this.osd) {
      this.osd.removeAllHandlers('viewport-change')
      this.osd.world.removeAllHandlers('add-item')
      this.osd = null
    }
    let newWrapperEl = document.createElement('div')
    newWrapperEl.id = `ve-media-${this.id}`
    newWrapperEl.classList.add('mirador-wrapper')
    let newMiradorEl = document.createElement('div')
    newMiradorEl.id = `mirador-${this.id}`
    newMiradorEl.classList.add('ve-mirador')
    newWrapperEl.appendChild(newMiradorEl)

    this.wrapperEl?.parentElement.replaceChild(newWrapperEl, this.wrapperEl)
    this.miradorEl = newMiradorEl
    this.miradorReady = false
    this.doInit = true
  }

  @Watch('imageList')
  imageListChanged(imageList) {
    if (imageList.length > 0) {
      this.sourceDimensions = {x: imageList[0].info.width, y: imageList[0].info.height}
      this.id = `${this.compare ? 'compare' : 'grid'}-${uuidv4().split('-')[0]}`
      this.mediaType = this.compare ? 'image-compare' : 'image-grid'
    }
  }

  @Watch('annoPath')
  async annoPathChanged(annoPath) {
    // console.log(`annoPath=${annoPath}`)
    this.annotator = new Annotator(this.osd, annoPath)
    await this.annotator.loadAnnotations()
  }

  @Watch('mediaType')
  mediaTypeDefined() {
    this.addInteractionHandlers()
  }

  @Watch('osd')
  onOsdFound(osd) {
    if (osd) {
      this.mediaType = 'image'
      let tiledImage = this.osd.world.getItemAt(0)
      if (tiledImage.getFullyLoaded()) {
        let imageUrl = tiledImage.source['id'] || tiledImage.source['@id']
        if (imageUrl) this.annoPath = `${this.annoBase}/${sha256(imageUrl).slice(0,8)}`
        this.sourceDimensions = tiledImage.source.dimensions
        this.miradorReady = true
      } else {
        tiledImage.addHandler('fully-loaded-change', (evt) => {
          if (evt.fullyLoaded) {
            this.sourceDimensions = tiledImage.source.dimensions
            this.miradorReady = true
          }
        })
      }
      this.miradorViewer.render()
      this.osd.addHandler('viewport-change', () => this.getViewportBounds())
    }
  }

  @Watch('mediaPlayer')
  onMediaPlayerFound(mediaPlayer) {
    if (mediaPlayer) {
      this.mediaPlayer.addEventListener(this.mediaType === 'video' ? 'loadeddata' : 'loadedmetadata', () => {
        this.sourceDimensions = this.mediaType === 'video'
          ? {x: (this.mediaPlayer as HTMLVideoElement).videoWidth, y: (this.mediaPlayer as HTMLVideoElement).videoHeight}
          : {x: this.mediaPlayer.clientWidth, y: this.mediaPlayer.clientHeight}
        this.doLayout()
        this.monitor()
        if (this.autostart) this.seekTo(this.start || '0', this.end || `${this.mediaPlayer.duration}`)
        this.miradorReady = true
      })
    }

  }

  @Watch('miradorReady')
  ondMiradorReady(isReady) {
    if (isReady) {
      this.observer.disconnect()
      this.osdContainer = null
      // console.log(`miradorReady: mediaType=${this.mediaType}`, this.sourceDimensions)
      this.doLayout()
    }
  }

  connectedCallback() {}

  componentWillLoad() { 
    this.el.classList.add('ve-component')
    if (this.manifest) {
      if (this.manifest.indexOf('http') !== 0) this.manifest = `https://iiif.juncture-digital.org/${this.manifest}/manifest.json`
      this.id = `mirador-${uuidv4().split('-')[0]}`
    } else {
      this.buildImagesList()
      this.listenForSlotChanges()
    }
  }
  
  // componentWillRender() { console.log('componentWillRender') }

  componentDidRender() {
    if (this.doInit && this.id) {
      this.doInit = false
      this.doOnFirstRender()
    }

    // if (!this.wrapperEl && this.id) this.doOnFirstRender()
  }

  // componentDidLoad() { console.log('componentDidLoad') }
  // componentWillUpdate() { console.log('componenWillUpdate') }
  // componentDidUpdate() { console.log('componenDidUpdate') }

  doOnFirstRender() {
    this.wrapperEl = document.getElementById(`ve-media-${this.id}`)
    // console.log('doOnFirstRender', this.id, this.wrapperEl)
    if (this.compare || this.grid) {
      this.doLayout()
    } else {
      this.miradorEl = this.wrapperEl.querySelector(`#mirador-${this.id}`)
      if (this.sticky) makeSticky(this.el)
      // this.doLayout()

      // Watch Mirador element to get viewer references
      this. observer = new MutationObserver(() => {
        let videoEl = this.miradorEl.querySelector('video')
        if (videoEl) {
          this.mediaType = 'video'
          if (!this.mediaPlayer) this.mediaPlayer = videoEl
        } else {
          let audioEl = this.miradorEl.querySelector('audio')
          if (audioEl) {
            this.mediaType = 'audio'
            if (!this.mediaPlayer) this.mediaPlayer = audioEl
          } else {
            if (!this.osdContainer) {
              Array.from(this.wrapperEl.querySelectorAll('.mirador-osd-container')).forEach(miradorOsdContainer => {
                this.osdContainer = this.miradorEl.querySelector(`#${miradorOsdContainer.id}`)
                if (this.osdContainer) {
                  let osd: OpenSeadragon.Viewer = window['osdInstances'][this.osdContainer.id.slice(0,-4)]
                  let tiledImage = osd.world.getItemAt(0)
                  if (tiledImage) {
                    if (tiledImage.getFullyLoaded()) this.osd = osd
                    else tiledImage.addHandler('fully-loaded-change', (evt) => { if (evt.fullyLoaded) this.osd = osd })
                  } osd.world.addHandler('add-item', () => {
                    let tiledImage = osd.world.getItemAt(0)
                    if (tiledImage.getFullyLoaded()) this.osd = osd
                    else tiledImage.addHandler('fully-loaded-change', (evt) => { if (evt.fullyLoaded) this.osd = osd })
                  })
                }
              })
            }
          }
        }
      })
      this.observer.observe(this.miradorEl, { childList: true, subtree: true, attributes: true })
      this.initMiradorViewer()
    }
  }

  initMiradorViewer() {
    let config = {...defaults, ...{ 
      element: this.miradorEl,
      windows: [ 
        {
          loadedManifest: this.manifest,
          canvasIndex: this.seq-1,
        }
      ],
      thumbnailNavigation: {
        displaySettings: false
      },
      osdConfig: {
        visibilityRatio: 1.0,
        constrainDuringPan: true,
        minZoomImageRatio: 1,
        maxZoomPixelRatio: 5,
        prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
        showNavigationControl: true,
        showRotationControl: true,
        showHomeControl: true,
        showZoomControl: true,
        sequenceMode: true,

  
      }
    }}
    if (this.fit === 'cover') config.osdConfig.homeFillsViewer = true
    this.miradorViewer = Mirador.viewer(config)
  }

  doLayout() {

    let wrapper = this.wrapperEl
    // console.log(this.wrapperEl, this.sourceDimensions)
    let requestedWidth = this.width
    let requestedHeight = this.height

    let orientation = this.sourceDimensions.y > this.sourceDimensions.x ? 'portrait' : 'landscape'
    let hwRatio = Number((this.sourceDimensions.x/this.sourceDimensions.y).toFixed(4))

    let position = this.position ? this.position : this.right ? 'right' : this.left ? 'left' : 'full'
    this.el.classList.add(position)

    const miradorHeaderHeight = this.compare ? 0 : 48
    
    if (position === 'full') { // Full-width layout

      wrapper.style.width = requestedWidth || '100%'      
      let width = parseInt(window.getComputedStyle(wrapper).width.slice(0,-2))   
      wrapper.style.height = requestedHeight || (
        this.mediaType === 'image-grid'
          ? '100%'
          : this.mediaType === 'audio'
            ? '200px'
            : `${Math.round(width / hwRatio) + miradorHeaderHeight}px`)
      let height = parseInt(window.getComputedStyle(wrapper).height.slice(0,-2)) || (orientation === 'portrait' ? Math.round(width * hwRatio) : Math.round(width / hwRatio))  
      
      if (this.compare) {
        let maxHeight = Math.round(window.innerHeight * .5)
        if (height > maxHeight) {
          wrapper.style.height = `${maxHeight}px`
          wrapper.style.width = `${Math.round(maxHeight * hwRatio)}px`
        }
      }
      if (this.sticky) {
        let maxHeight = Math.round(window.innerHeight * .5)
        if (height > maxHeight) {
          wrapper.style.height = `${maxHeight + miradorHeaderHeight}px`
          wrapper.style.width = '100%'
          this.miradorEl.style.width = `${Math.round(maxHeight * hwRatio )}px`
          this.miradorEl.style.margin = 'auto'
          this.miradorEl.classList.add('shadow')
        }
      }

    } else { // Half-width layout (left or right)

      wrapper.style.float = position
      wrapper.style.width = requestedWidth || '50%'
      let width = parseInt(window.getComputedStyle(wrapper).width.slice(0,-2))
      wrapper.style.height = requestedHeight || (
        this.mediaType === 'image-grid'
          ? '100%'
          : this.mediaType === 'audio'
            ? '200px'
            :`${Math.round(width / hwRatio + miradorHeaderHeight)}px`)
  
    }

    if (!this.fit && (this.height || this.width)) this.fit = 'cover'

    let computedWidth =  parseInt(window.getComputedStyle(wrapper).width.slice(0,-2))
    let computedHeight = parseInt(window.getComputedStyle(wrapper).height.slice(0,-2)) || (orientation === 'portrait' ? Math.round(computedWidth * hwRatio) : Math.round(computedWidth / hwRatio))
    this.computedDimensions = {x: computedWidth, y: computedHeight}

    if (this.mediaType === 'image') setTimeout(() => this.positionImage(true), 100)

    // console.log(`ve-media.doLayout: type=${this.mediaType} seq=${this.seq} requestedWidth=${requestedWidth} requestedHeight=${requestedHeight} hwRatio=${hwRatio} position=${position} orientation=${orientation} compare=${this.compare} width=${this.sourceDimensions.x} height=${this.sourceDimensions.y} hwRatio=${hwRatio} computedWidth=${computedWidth} computedHeight=${computedHeight}`)
  }

  positionImage(immediately:boolean=false) {
    if (this.options) this.setRegion(this.options, immediately)
    else this.osd.viewport.goHome(immediately)
  }

  setRegion(regionStr: string, immediately:boolean=false) {
    this.osd.viewport.fitBounds(parseRegionString(regionStr, this.osd), immediately)
  }

  isIiifArgs(str:string) {
    return /^\d+,\d+,\d+,\d+\b|^pct:[0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+$/.test(str)
  }

  isInt(str:string) {
    return /^[0-9]+$/.test(str)
  }

  parseImageStr(s:string) {
    let tokens = []
    s = s.replace(/“/,'"').replace(/”/,'"').replace(/’/,"'")
    s.match(/[^\s"]+|"([^"]*)"/gmi).forEach(token => {
      if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
      else tokens.push(token)
    })
    let obj:any = {seq: 1, options: parseImageOptions('')}
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i]
      if (i === 0) {
        obj.manifest = decodeURIComponent(token)
        if (obj.manifest.indexOf('http') !== 0) obj.manifest = `https://iiif.juncture-digital.org/${obj.manifest}/manifest.json`
      } else if (token.indexOf('=') > 0) {
        let split = token.split('=')
        obj[split[0]] = split[1]
      } else if (this.isInt(token)) {
        obj.seq = parseInt(token)
      } else if (this.isIiifArgs(token)) {
        obj.options = parseImageOptions(token)
      } else if (token === 'cover' || token === 'contain') {
        obj.fit = token
      } else {
        obj.caption = token[0] === '"' && token[token.length-1] === '"' ? token.slice(1,-1) : token
      }
    }
    return obj
  }

  async buildImagesList() {
    let images = Array.from(this.el.querySelectorAll('li, span')).map(li => this.parseImageStr(li.innerHTML))
    if (images.length > 0) await loadManifests(images.map(item => item.manifest))
      .then(manifests => {
        manifests.forEach((manifest, idx) => {
          let img = images[idx]
          img.info = imageInfo(manifest, images[idx].seq)
          img.manifest = manifest
          img.tileSource = img.info.service ? img.info.service[0].id : { url: img.info.id, type: 'image', buildPyramid: true }
          img.url = `${img.tileSource}/${img.options.region}/${img.options.size}/${img.options.rotation}/${img.options.quality}.${img.options.format}`
        })
      })
    this.imageList = images
    // Array.from(this.el.querySelectorAll('li')).forEach(li => li.parentElement.removeChild(li))
  }

  listenForSlotChanges() {
    let slot = this.el.querySelector('ve-media > ul, ve-media > span')
    if (slot) {
      (new MutationObserver(() => this.buildImagesList())).observe(slot, { childList: true, subtree: true, characterData: true })
    }
  }

  imageUrl({img, width=0, height=0}) {
    let size = width
      ? height ? `${width},${height}` : `${width},`
      : height ? `,${height}` : 'full'
    let url = `${img.tileSource}/${img.options.region}/${size}/${img.options.rotation}/${img.options.quality}.${img.options.format}`
    return url
  }

  scaleImages() {
    let targetWidth = this.computedDimensions.x
    let targetHeight = this.computedDimensions.y
    let targetAspectRatio = Number((targetWidth/targetHeight).toFixed(4))

    return this.imageList.map(img => {
      console.log(img)
      
      let x,y,w,h
      if (img.options.region !== 'full') {
        [x,y,w,h] = img.options.region.split(',').map(s => parseInt(s))
        console.log(x,y,w,h)
      }

      const inputWidth = w || img.info.width
      const inputHeight = h || img.info.height
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

      console.log(`${inputWidth}x${inputHeight} ${outputWidth}x${outputHeight} ${Number((outputWidth/outputHeight).toFixed(4))}`)

      const outputX = (x || 0) + Math.abs(Math.round((outputWidth - inputWidth) * 0.5))
      const outputY = (y || 0) + Math.abs(Math.round((outputHeight - inputHeight) * 0.5))

      let region = `${outputX},${outputY},${outputWidth},${outputHeight}`

      let imgUrl = `${img.tileSource}/${region}/${targetWidth},${targetHeight}/${img.options.rotation}/${img.options.quality}.${img.options.format}`

      return imgUrl
    })
  }

  copyTextToClipboard(text: string) {
    if (navigator.clipboard) navigator.clipboard.writeText(text)
  }

  isImageZoomTo(attr:Attr) {
    let name = attr.name.toLowerCase()
    let value = attr.value
     if ((name === 'enter' || name === 'exit') && value.indexOf('|') > 0) [name, value] = value.split('|')
    return ['zoom', 'zoomto'].indexOf(name.toLowerCase()) === 0 || /^((pct:|pixel:|px:)?[\d.]+,[\d.]+,[\d.]+,[\d.]+)?\|?([0-9a-f]{8})?$/.test(value)
  }

  isPlayMedia(attr:Attr) {
    let name = attr.name.toLowerCase()
    let value = attr.value
    if ((name === 'enter' || name === 'exit') && value.indexOf('|') > 0) [name, value] = value.split('|')
    return name.toLowerCase() === 'play' || /^([0-9:]+)+,?([0-9:]+)?$/.test(value)
  }

  isPauseMedia(attr:Attr) {
    let name = attr.name.toLowerCase()
    let value = attr.value.toLowerCase()
    return name === 'pause' || value === 'pause'
  }

  addInteractionHandlers() {
    Array.from(document.querySelectorAll('[enter],[exit]')).forEach((el:HTMLElement) => {
      let veMedia = this.findVeMedia(el)
      if (veMedia) this.addMutationObserver(el)
    })

    Array.from(document.querySelectorAll('mark')).forEach(mark => {
      Array.from(mark.attributes).forEach(attr => {
        if (this.mediaType === 'image' && this.isImageZoomTo(attr) ||
            (this.mediaType !== 'image' && (this.isPlayMedia(attr) || this.isPauseMedia(attr)))) {
          let veMedia = this.findVeMedia(mark.parentElement)
          if (veMedia) {
            mark.classList.add(this.mediaType === 'image' ? 'zoom' : 'play')
            mark.addEventListener('click', () => {
              if (this.mediaType === 'image') this.zoomto(attr.value)
              else if (this.isPlayMedia(attr)) this.playMedia(attr.value)
              else this.pauseMedia()
            })
          }
        }
      })
    })
  }

  findVeMedia(el: HTMLSpanElement) {
    let sib = el.previousSibling
    while (sib) {
      if (sib.nodeName === 'VE-MEDIA') return sib === this.el ? sib : null
      sib = sib.previousSibling
    }
    while (el.parentElement && el.tagName !== 'MAIN') {
      el = el.parentElement
      let veMedia = el.querySelector(':scope > ve-media')
      if (veMedia) return veMedia === this.el ? veMedia : null
    }
  }

  addMutationObserver(el: HTMLElement) {
    let prevClassState = el.classList.contains('active')
    let observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName == 'class') {
          let currentClassState = (mutation.target as HTMLElement).classList.contains('active')
          if (prevClassState !== currentClassState) {
            prevClassState = currentClassState
            let attr = el.attributes.getNamedItem(currentClassState ? 'enter' : 'exit')
            if (attr) {
              if (this.mediaType === 'image' && this.isImageZoomTo(attr)) this.zoomto(attr.value)
              if (this.mediaType !== 'image') {
                if (this.isPlayMedia(attr)) this.playMedia(attr.value)
                else if (this.isPauseMedia) this.pauseMedia()
              } 
            }
          }
        }
      })
    })
    observer.observe(el, {attributes: true})
  }

  playMedia(arg: string) {
    arg = arg.replace(/^play\|/i,'')
    const match = arg.match(/^([0-9:]+)+,?([0-9:]+)?$/)
    this.seekTo(match[1], match[2])
  }

  pauseMedia() {
    this.pause()
  }

  zoomto(arg: string) {
    arg = arg.replace(/^zoomto\|/i,'')
    const found = arg?.match(/^((pct:|pixel:|px:)?[\d.]+,[\d.]+,[\d.]+,[\d.]+)?\|?([0-9a-f]{8})?$/)
    if (!found) return
    console.log(found)
    let region = found[1]
    let annoId = found[3]
    console.log(`ve-media.zoomto: region=${region} annoId=${annoId}`)
    if (region) this.setRegion(region)
    if (annoId) this.annotator.select(annoId)
  }

  /******************* Audio/Video Player Methods *******************/
  monitor() {
    setInterval(async () => {
      this.isMuted = this.getIsMuted()
      this.isPlaying = this.getIsPlaying()
      // if (this.isPlaying) console.log(`${this.mediaType}: isMuted=${this.isMuted} isPlaying=${this.isPlaying} currentTime=${this.getCurrentTime()}`)
    }, 1000)
  }

  play() {
    this.mediaPlayer.play()
  }

  pause() {
    this.mediaPlayer.pause()
  }

  getCurrentTime() {
    return Math.round(this.mediaPlayer.currentTime)
  }

  getIsPlaying() {
    return !(this.mediaPlayer.ended || this.mediaPlayer.paused)
  }

  getIsMuted() {
    return this.mediaPlayer.muted
  }

  setMuted(mute:boolean) {
    this.mediaPlayer.muted = mute
  }

  hmsToSeconds(str:string) {
    var p = str.split(':').slice(0,3).map(pe => parseInt(pe, 10))
    let secs = 0, m = 1
    while (p.length > 0) {
      secs += m * p.pop()
      m *= 60
    }
    return secs
  }

  seekTo(start:string, end:string) {
    let startSecs = start ? this.hmsToSeconds(start) : 0
    let endSecs = end ? this.hmsToSeconds(end) : -1
    // console.log(`seekTo: start=${startSecs} end=${endSecs} isMuted=${this.isMuted} forceMuteOnPlay=${this.forceMuteOnPlay}`)
    
    // clear delayed pause
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    let wasMuted = this.isMuted
    if (this.forceMuteOnPlay) this.setMuted(true)

    setTimeout(() => {
      this.play()
      this.mediaPlayer.currentTime = startSecs
      if (endSecs >= startSecs) {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null
          this.mediaPlayer.pause()
          if (!wasMuted && this.forceMuteOnPlay) this.setMuted(false)
        }, endSecs === startSecs ? 200 : (endSecs-startSecs)*1000)
      }
    }, 200)
  }

  /******************* End Audio/Video Player Methods *******************/

  showDetailsDialog(selected:any) {
    console.log('showDetailsDialog', selected)

    this.selected = selected

    let dialog = document.getElementById(`details-dialog-${this.id}`) as SLDialog

    let width = this.el.parentElement.clientWidth
    this.detailsDialog.width = `${width}px`

    if (selected.manifest) { // Image
      const toolbarHeight = 48
      let _imageInfo = imageInfo(selected.manifest)
      let hwRatio = _imageInfo.height/_imageInfo.width
      this.detailsDialog.height = `${Math.round(width * hwRatio + toolbarHeight)}px`
    } else { // Map
      this.detailsDialog.height = `${width}px`
    }
    
    dialog.style.height = this.detailsDialog.height
    dialog.panel.style.height = this.detailsDialog.height
    
    if (!dialog.onclick) {
      dialog.onclick = function () { }
      dialog.addEventListener('sl-show', () => {
        dialog.panel.style.width = this.detailsDialog.width
        dialog.panel.style.height = this.detailsDialog.height
      })
      dialog.addEventListener('sl-hide', () => {
        this.el.style.zIndex = '3'
      })

    }
    this.el.style.zIndex = '4'
    setTimeout(() => dialog.show(), 200)

  }

  @Listen('imageSelectedEvent')
  async onimageSelectedEvent(evt: CustomEvent) {
    this.showDetailsDialog(evt.detail)
  }

  _value(langObj: any, language='en') {
    return typeof langObj === 'object'
      ? langObj[language] || langObj.none || langObj[Object.keys(langObj).sort()[0]]
      : langObj
  }

  renderThumbnails() {
    return [
      <div id={`ve-media-${this.id}`} class="grid-wrapper">
        <div class={`images ${Array.from(this.el.classList).find(cls => cls.indexOf('col') === 0) || ''}`}>
          { this.imageList.map(img => 
            <sl-tooltip content={img.caption || label(img.manifest)} disabled={isTouchEnabled()}>
              <div class="thumbnail">
                <img src={thumbnail(img.manifest)} alt={label(img.manifest)} onClick={this.showDetailsDialog.bind(this, {manifest: img.manifest})}/>
                { img.caption && <div innerHTML={img.caption}></div> }
              </div>
            </sl-tooltip>
          )}
        </div>
        {this.caption && <div class="caption" innerHTML={this.caption}></div>}
      </div>,
      <sl-dialog id={`details-dialog-${this.id}`} no-header>
        { this.selected.manifest && <ve-media manifest={this.selected.manifest.id} width={this.detailsDialog.width}></ve-media> }
      </sl-dialog>
    ]
  }

  renderAsCards() {
    return [
      <div id={`ve-media-${this.id}`} class="cards grid-wrapper">
        { this.imageList.map(item => item.manifest.id).map(manifest => <ve-image-card manifest={manifest}></ve-image-card>) }
      </div>,
      <sl-dialog id={`details-dialog-${this.id}`} no-header>
        { this.selected.manifest && <ve-media manifest={this.selected.manifest.id} width={this.detailsDialog.width}></ve-media> }
        { this.selected.coords && <ve-map center={this.selected.coords} marker={this.selected.coords} width={this.detailsDialog.width}></ve-map> }
      </sl-dialog>
    ]
  }

  renderViewportCoords() {
    return <span id="coords" class="viewport-coords" onClick={this.copyTextToClipboard.bind(this, this.viewportBounds)}>{this.viewportBounds}</span>
  }

  renderCompareViewer() {
    return <div id={`ve-media-${this.id}`} class="compare-wrapper">
      <sl-image-comparer position="50">
        {this.computedDimensions && this.scaleImages().map((img:any, idx:number) =>
          <img style={{}}
            slot={idx === 0 ? 'before' : 'after'}
            src={img}
            alt={this._value(this.imageList[idx].manifest.label).toString()}
          />
        )}
      </sl-image-comparer>
    </div>
  }

  renderMiradorViewer() {
    return <div id={`ve-media-${this.id}`} class="mirador-wrapper">
      <div id={`mirador-${this.id}`} class="ve-mirador"></div>
      { this.viewportBounds && this.renderViewportCoords() }
    </div>
  }

  render() {
    return this.compare
        ? this.renderCompareViewer()
        : this.grid
          ? this.cards
            ? this.renderAsCards()
            : this.renderThumbnails()
          : this.renderMiradorViewer()
  }

}
