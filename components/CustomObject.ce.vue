<template>
    <div>{{ user }}</div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
  
  const props = defineProps({
    user: {
      type: Object,
      default: () => ({}),
    },
  });
  </script>