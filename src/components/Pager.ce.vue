<template>

  <div ref="root" class="pagination">
    <span class="prev" @click="current > 1 && --current" :disabled="current === 1">&laquo;</span>
    <span class="current" v-html="current"></span> / 
    <span class="total" v-html="props.total"></span>
    <span class="next" @click="current < props.total && ++current" :disabled="current === props.total">&raquo;</span>
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
    align-items: center;
    justify-content: center;
    background-color: #eee;
    height: 30px;
    color: #444;
  }

  .current, .total {
    padding: 0 12px;
    font-size: 1.3rem;
  }

  .prev[disabled="true"],
  .next[disabled="true"] {
    color: #ccc;
    cursor: unset;
  }

  .prev, .next {
    height: 100%;
    float: left;
    padding: 0 8px;
    text-decoration: none;
    transition: background-color .3s;
    cursor: pointer;
    font-size: 40px;
    margin-top: -28px;
  }

  .prev[disabled="false"]:hover,
  .next[disabled="false"]:hover {
    color: var(--sl-color-primary-700);
  }

</style>