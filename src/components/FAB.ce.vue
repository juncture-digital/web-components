<template>

  <div ref="root" class="fab-wrapper" 
    :style="{
      right: props.right,
      bottom: props.bottom}"
    >
    <sl-tooltip :content="props.label" placement="top" :disabled="isMobile">
      <span data-action="props.action" class="fab-button" 
        @click="onClick" 
        :style="{
          backgroundColor: props.color,
        }">
        <sl-icon :name="props.icon" style="font-size:36px;"></sl-icon>
      </span>
    </sl-tooltip>
  </div>

</template>
  
<script setup lang="ts">

  import { ref } from 'vue'

  import { isMobile as _isMobile } from '../utils'

  import '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'

  const emit = defineEmits(['fabClicked'])

  const root = ref<HTMLElement | null>(null)
  const isMobile = ref(_isMobile())

  const props = defineProps({
    color: { type: String, default: 'red'},
    label: { type: String },
    icon: { type: String },
    action: { type: String },
    right: { type: String, default: '35px' },
    bottom: { type: String, default: '35px' }
  })

  function onClick() {
    emit('fabClicked', props.action)
  }

</script>

<style>

  .fab-wrapper {
    position: absolute;
    bottom: 35px; right: 35px;
  }

  .fab-button {
    height: 56px;
    width: 56px;
    background-color: red;
    border-radius: 50%;
    color: #fff;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    opacity: 0.4;
  }
  .fab-button:hover {
    opacity: 1;
    transition: all 0.4s;
    cursor: pointer;
  }

  .fab-button i {
    font-size: 16px;
    transform: rotate(0deg);
    transition: all 0.4s;
  }

</style>