<template>

  <sl-button v-if="!props.authRequired || isLoggedIn" ref="root" @click="toggleWindow">
    <sl-icon v-if="props.icon" slot="prefix" :name="props.icon"></sl-icon>
    {{ props.label }}
  </sl-button>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/button/button.js'
  import '@shoelace-style/shoelace/dist/components/icon/icon.js'

  const state:any = window

  const props = defineProps({
    href: { type: String },
    target: { type: String },
    width: { type: Number },
    height: { type: Number},
    top: { type: Number, default: 0},
    left: { type: Number, default: 0},
    label: { type: String },
    icon: { type: String },
    authRequired: { type: Boolean, default: false }
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  const authToken = ref<string | null>('')
  const isLoggedIn = computed(() => authToken.value !== null)

  onMounted(() => {
    authToken.value = window.localStorage.getItem('gh-auth-token')
    window.addEventListener('storage', () => authToken.value = window.localStorage.getItem('gh-auth-token'))
  })

  watch(host, () => {
    if (host.value?.parentElement.tagName === 'LI' && host.value.parentElement.children.length === 1) {
      host.value.parentElement.style.display = !props.authRequired || isLoggedIn.value ? 'block' : 'none'
    }
  })

  watch(isLoggedIn, () => {
    if (host.value?.parentElement.tagName === 'LI' && host.value.parentElement.children.length === 1) {
      host.value.parentElement.style.display = !props.authRequired || isLoggedIn.value ? 'block' : 'none'
    }
  })

  function toggleWindow() {
    if (props.target === '_blank') {
      let width = props.width || 1040
      let height = props.height || Math.max(window.innerHeight, 1500)
      if (state.junctureWindow) { state.junctureWindow.close() }
      let options = `toolbar=yes,location=yes,left=${props.left},top=${props.top},width=${width},height=${height},scrollbars=yes,status=yes`
      state.junctureWindow = window.open(props.href, '_blank', options)
    } else if (props.href) {
      location.href = props.href
    }
  }

</script>

<style src='../style.css'></style> 

<style>
  :host {
    display: inline-block;
  }
</style>