<template>

  <sl-button ref="root" @click="toggleWindow">{{ props.buttonLabel }}</sl-button>

</template>
  
<script setup lang="ts">

  import { ref } from 'vue'
  import type SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'

  const state:any = window

  const props = defineProps({
    href: { type: String },
    width: { type: Number, default: 1040 },
    height: { type: Number, default: 1000},
    top: { type: Number, default: 0},
    left: { type: Number, default: 0},
    buttonLabel: { type: String, default: 'Open' }
  })

  const root = ref<HTMLElement | null>(null)

  function toggleWindow() {
    if (state.junctureWindow) { state.junctureWindow.close() }
    let options = `toolbar=yes,location=yes,left=0,top=0,width=${props.width},height=${props.height},scrollbars=yes,status=yes`
    state.junctureWindow = window.open(props.href, '_blank', options)
  }

</script>

<style src='../style.css'></style> 

<style>
  :host {
    display: inline-block;
    margin: 0 6px;
  }
</style>