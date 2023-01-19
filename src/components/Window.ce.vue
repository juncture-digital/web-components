<template>

  <div ref="root" id="main">

    <sl-button @click="toggleWindow">{{ props.buttonLabel }}</sl-button>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, ref, watch } from 'vue'
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
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  watch(host, () => {host.value.style.display = 'inline-block'})

  function toggleWindow() {
    if (state.junctureWindow) { state.junctureWindow.close() }
    let options = `toolbar=yes,location=yes,left=0,top=0,width=${props.width},height=${props.height},scrollbars=yes,status=yes`
    state.junctureWindow = window.open(props.href, '_blank', options)
  }

</script>

<style>
</style>