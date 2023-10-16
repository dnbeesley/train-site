<template>
  <table>
    <tbody>
      <tr v-for="(state, i) in motorControlState" v-bind:key="i">
        <td>
          {{ i }}
        </td>
        <td>
          <input
            type="range"
            min="0"
            max="255"
            v-model="state.speed"
            @changed="() => onSliderChange(state)"
            @mouseup="() => onSliderMouseUp(state)"
          />
        </td>
        <td>
          <input
            type="number"
            min="0"
            max="255"
            v-model="state.speed"
            @changed="() => onSliderMouseUp(state)"
          />
        </td>
        <td>
          <q-icon
            :name="
              state.isReversed
                ? motorControls[i].reverseIcon || motorControls[i].forwardIcon
                : motorControls[i].forwardIcon
            "
            @click="() => onDirectionChanged(state)"
            :class="
              state.isReversed && !motorControls[i].reverseIcon ? 'flip' : ''
            "
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
i.q-icon {
  font-size: 10rem;
}

i.q-icon.flip {
  transform: scaleX(-1);
}

input[type='number'] {
  width: 100px;
}

input[type='range'] {
  width: 500px;
}
</style>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { Config } from 'src/models/config.models';
import { MotorControlState } from 'src/models/motor-control.models';
import { LayoutService, getConfig } from 'src/services/layout.service';
import lodash from 'lodash';

export default defineComponent({
  name: 'MotorControlComponent',
  emits: {
    update: (id: number, state: MotorControlState) =>
      id !== undefined && state !== undefined,
  },
  setup() {
    const config = ref<Config>();
    const motorControlState = ref<MotorControlState[]>([
      {
        isReversed: false,
        speed: '0',
      },
      {
        isReversed: false,
        speed: '0',
      },
    ]);
    const lastSentValue = ref<number[]>();

    const layoutService = new LayoutService(config, motorControlState);

    onMounted(async () => {
      config.value = await getConfig();
      layoutService.connect();

      lastSentValue.value = lodash.map(motorControlState.value ?? [], (s) =>
        parseInt(s.speed)
      );
    });

    onUnmounted(() => {
      layoutService.close();
    });

    return {
      motorControls: [
        {
          id: 0,
          forwardIcon: 'sync',
        },
        {
          id: 1,
          forwardIcon: 'north_west',
          reverseIcon: 'south_east',
        },
      ],
      motorControlState,
      onDirectionChanged(state: MotorControlState): void {
        state.isReversed = !state.isReversed;
        layoutService.updateMotorControlState();
      },
      onSliderChange(state: MotorControlState): void {
        const speedInt = parseInt(state.speed);
        const i = motorControlState.value?.indexOf(state) ?? -1;
        if (
          Math.abs(
            speedInt - ((lastSentValue.value && lastSentValue.value[i]) || 0)
          ) >= 10
        ) {
          if (lastSentValue.value) {
            lastSentValue.value[i] = speedInt;
          }
          console.log('onSliderChange');
          console.log(motorControlState.value);
          layoutService.updateMotorControlState();
        }
      },
      onSliderMouseUp(state: MotorControlState): void {
        const speedInt = parseInt(state.speed);
        const i = motorControlState.value?.indexOf(state) ?? -1;
        if (lastSentValue.value) {
          lastSentValue.value[i] = speedInt;
        }
        console.log('onSliderMouseUp');
        console.log(motorControlState.value);
        layoutService.updateMotorControlState();
      },
    };
  },
});
</script>
