<template>
  <q-page class="row items-center justify-evenly">
    <layout-component/>
  </q-page>
</template>

<script lang="ts">
import LayoutComponent from 'src/components/LayoutComponent.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { LayoutComponent }
});
</script>
