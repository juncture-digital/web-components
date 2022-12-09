<template>
    <div>{{ user }}</div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  
  const props = defineProps({
    user: {
      type: Object,
      default: () => ({}),
    },
  });
  </script>