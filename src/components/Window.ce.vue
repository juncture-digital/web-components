<template>

  <div ref="root" id="main">

    <sl-button @click="toggleWindow">{{ buttonLabel }}</sl-button>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref } from 'vue'
  import type SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'

  const state:any = window

  const props = defineProps({
    href: { type: String },
    width: { type: Number, default: 1040 },
    height: { type: Number, default: 1000},
    top: { type: Number, default: 0},
    left: { type: Number, default: 0}
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const buttonLabel = ref('Open')

  onMounted(() => { if ( host.value.innerHTML) buttonLabel.value = host.value.innerHTML })

  function toggleWindow() {
    console.log('toggleWindow', props.href, state.junctureWindow)

    if (state.junctureWindow) { state.junctureWindow.close() }
    let options = `toolbar=yes,location=yes,left=0,top=0,width=${props.width},height=${props.height},scrollbars=yes,status=yes`
    state.junctureWindow = window.open(props.href, '_blank', options)
  }

</script>

<style>
  :host {
    display: inline-block;
    margin: 0 6px;
  }
</style>