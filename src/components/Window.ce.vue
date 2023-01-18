<template>

  <sl-button ref="root" @click="toggleWindow">{{ buttonLabel }}</sl-button>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, nextTick, ref, toRaw, watch } from 'vue'
  import type SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'

  const state:any = window

  const props = defineProps({
    href: { type: String },
    width: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const buttonLabel = ref('Open')

  onMounted(() => { if ( host.value.innerHTML) buttonLabel.value = host.value.innerHTML })

  function toggleWindow() {
    console.log('toggleWindow', props.href, state.junctureWindow)

    if (state.junctureWindow) { state.junctureWindow.close() }
    let options = 'toolbar=yes,location=yes,left=0,top=0,width=1040,height=1200,scrollbars=yes,status=yes'
    state.junctureWindow = window.open(props.href, '_blank', options)
  }

</script>

<style>
</style>