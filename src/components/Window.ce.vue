<template>

  <sl-button ref="root" @click="toggleWindow">
    <sl-icon v-if="props.buttonIcon" slot="prefix" :name="props.buttonIcon"></sl-icon>
    {{ props.buttonLabel }}
  </sl-button>

</template>
  
<script setup lang="ts">

  import { ref } from 'vue'
  import type SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'

  const state:any = window

  const props = defineProps({
    href: { type: String },
    width: { type: Number },
    height: { type: Number},
    top: { type: Number, default: 0},
    left: { type: Number, default: 0},
    buttonLabel: { type: String, default: 'Open' },
    buttonIcon: { type: String }
  })

  const root = ref<HTMLElement | null>(null)

  function toggleWindow() {
    let width = props.width || 1040
    let height = props.height || Math.min(window.innerHeight, 1600)
    if (state.junctureWindow) { state.junctureWindow.close() }
    let options = `toolbar=yes,location=yes,left=${props.left},top=${props.top},width=${props.width},height=${height},scrollbars=yes,status=yes`
    state.junctureWindow = window.open(props.href, '_blank', options)
  }

</script>

<style src='../style.css'></style> 

<style>
  :host {
    display: inline-block;
  }
</style>