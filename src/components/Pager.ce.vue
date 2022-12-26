<template>

  <div ref="root" class="pagination">
    <span @click="current > 1 && --current" :disabled="current === 1">&laquo;</span>
    <span v-for="idx in props.total" :key="`item-${idx}`" :class="{'active': current === idx}" v-html="idx" @click="current = idx"></span>
    <span @click="current < props.total && ++current" :disabled="current === props.total">&raquo;</span>
  </div>

</template>
  
<script setup lang="ts">

  import { ref, watch } from 'vue'
  const emit = defineEmits(['image-selected'])

  const props = defineProps({
    total: { type: Number, required: true },
    current: { type: Number, default: 1 }
  })

  const current = ref()
  current.value = props.current

  watch(current, () =>  emit('image-selected', current.value))

</script>

<style>

  .pagination {
    display: flex;
  }

  .pagination span[disabled="true"] {
    color: #ccc;
    cursor: unset;
  }

  .pagination span {
    color: black;
    float: left;
    padding: 8px 16px;
    text-decoration: none;
    transition: background-color .3s;
    border: 1px solid #ddd;
    margin: 0 4px;
    cursor: pointer;
  }

  .pagination span.active {
    background-color: #4CAF50;
    color: white;
    border: 1px solid #4CAF50;
  }

  .pagination span:hover:not(.active) {background-color: #ddd;}

</style>