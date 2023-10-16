<template>
  <q-page class="row items-center justify-evenly">
    <motor-control-component/>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MotorControlComponent from 'src/components/MotorControlComponent.vue';

export default defineComponent({
  name: 'MotorControlPage',
  components: { MotorControlComponent }
});
</script>
