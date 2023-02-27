<template>

  <span v-html="version"></span>

</template>
  
<script setup lang="ts">

  import { ref } from 'vue'
  const version = ref(process.env.version)

</script>
