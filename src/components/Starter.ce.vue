<template>

  <div ref="root" class="main">
    &lt;ve-starter&gt;&lt;/ve-starter&gt;
  </div>

</template>
  
<script setup lang="ts">

  import { computed, ref, watch } from 'vue'
  const emit = defineEmits(['custom-event'])
  defineExpose({ increment:incrementVal }) // Expose resource for external use

  const props = defineProps({
    id: { type: String },
    numProp: { type: Number, default: 0 },
    boolProp: { type: Boolean }
  })

  const reactiveVal = ref(props.numProp)

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  watch(host, () => init())
  watch(reactiveVal, () => emit('custom-event', reactiveVal.value))

  function init() {
    console.log(host.value)
    console.log(shadowRoot.value?.querySelector('h1'))
    setTimeout(() => incrementVal(), 2000)
  }

  function incrementVal() {
    // invoked externally using el._instance.exposed.show.increment()
    ++reactiveVal.value
  }

</script>

<style>
  .main {
    color: red;
  }
</style>