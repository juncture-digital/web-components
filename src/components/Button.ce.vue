<template>

  <sl-button v-if="!props.authRequired || isLoggedIn" ref="root" @click="toggleWindow">
    <sl-icon v-if="props.icon" slot="prefix" :name="props.icon"></sl-icon>
    {{ props.label }}
  </sl-button>

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
    left: { type: Number, default: 0},
    label: { type: String },
    icon: { type: String },
    authRequired: { type: Boolean, default: false }
  })

  const root = ref<HTMLElement | null>(null)
  
  const authToken = ref<string | null>('')
  const isLoggedIn = computed(() => authToken.value !== null)


  onMounted(() => {
    authToken.value = window.localStorage.getItem('gh-auth-token')
    window.addEventListener('storage', () => authToken.value = window.localStorage.getItem('gh-auth-token'))
  })

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
  }
</style>