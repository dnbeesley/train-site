<template>
  <div style="overflow-x: auto">
    <svg :height="height" :width="width">
      <g v-for="line in config?.lines" :key="config?.lines.indexOf(line)">
        <marker
          :id="'mid-' + config?.lines.indexOf(line)"
          viewBox="0 0 60 60"
          refX="0"
          refY="30"
          markerUnits="strokeWidth"
          markerWidth="8"
          markerHeight="10"
          orient="auto"
        >
          <path d="M 0 0 L 60 30 L 0 60 z" fill="green" />
        </marker>
        <circle
          :cx="line.startNode.x"
          :cy="line.startNode.y"
          r="5"
          fill="black"
        />
        <polyline
          :key="lastUpdated"
          :points="
            getLinePoints(
              line,
              (motorControlState &&
                motorControlState[line.motorControlId]?.isReversed) ||
                false
            )
          "
          :marker-mid="'url(#mid-' + config?.lines.indexOf(line) + ')'"
          fill="none"
          stroke="black"
        />
        <circle :cx="line.endNode.x" :cy="line.endNode.y" r="5" fill="black" />
      </g>
      <g
        v-for="turnOut in config?.turnOuts"
        :key="config?.turnOuts.indexOf(turnOut)"
      >
        <line
          :x1="turnOut.commonNode.x"
          :y1="turnOut.commonNode.y"
          :x2="(turnOut.commonNode.x + turnOut.forwardNode.x) / 2"
          :y2="(turnOut.commonNode.y + turnOut.forwardNode.y) / 2"
          stroke="black"
          @click="switchTurnOut(turnOut)"
        />
        <line
          :x1="(turnOut.commonNode.x + turnOut.forwardNode.x) / 2"
          :y1="(turnOut.commonNode.y + turnOut.forwardNode.y) / 2"
          :x2="turnOut.forwardNode.x"
          :y2="turnOut.forwardNode.y"
          :class="turnOut.turnedOut ? 'dashed' : ''"
          stroke="black"
          @click="switchTurnOut(turnOut)"
        />
        <line
          :x1="(turnOut.commonNode.x + turnOut.forwardNode.x) / 2"
          :y1="(turnOut.commonNode.y + turnOut.forwardNode.y) / 2"
          :x2="turnOut.turnOutNode.x"
          :y2="turnOut.turnOutNode.y"
          :class="turnOut.turnedOut ? '' : 'dashed'"
          stroke="black"
          @click="switchTurnOut(turnOut)"
        />
        <polygon
          style="fill: transparent"
          :points="`${turnOut.commonNode.x},${turnOut.commonNode.y} ${turnOut.forwardNode.x},${turnOut.forwardNode.y} ${turnOut.turnOutNode.x},${turnOut.turnOutNode.y}`"
          @click="switchTurnOut(turnOut)"
        />
      </g>
    </svg>
  </div>
</template>

<style>
line {
  stroke-width: 2;
}

line.dashed {
  stroke-dasharray: 5, 5;
}

polyline {
  stroke-width: 2;
}
</style>

<script lang="ts">
import lodash from 'lodash';
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { Config, Line, TurnOut } from 'src/models/config.models';
import { MotorControlState } from 'src/models/motor-control.models';
import { LayoutService, getConfig } from 'src/services/layout.service';

export default defineComponent({
  name: 'config.valueComponent',
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

    const height = ref(100);
    const lastUpdated = ref(0);
    const width = ref(100);

    const layoutService = new LayoutService(config, motorControlState);

    onMounted(async () => {
      config.value = await getConfig();
      layoutService.connect();

      const linesXMax =
        lodash.max(
          lodash.map(config.value.lines, (line: Line) =>
            Math.max(line.endNode.x, line.startNode.x)
          )
        ) ?? 0;
      const linesYMax =
        lodash.max(
          lodash.map(config.value.lines, (line: Line) =>
            Math.max(line.endNode.y, line.startNode.y)
          )
        ) ?? 0;
      const turnOutsXMax =
        lodash.max(
          lodash.map(config.value.turnOuts, (turnOut: TurnOut) =>
            Math.max(
              turnOut.commonNode.x,
              turnOut.forwardNode.x,
              turnOut.turnOutNode.x
            )
          )
        ) ?? 0;
      const turnOutsYMax =
        lodash.max(
          lodash.map(config.value.turnOuts, (turnOut: TurnOut) =>
            Math.max(
              turnOut.commonNode.y,
              turnOut.forwardNode.y,
              turnOut.turnOutNode.y
            )
          )
        ) ?? 0;
      height.value = Math.max(linesYMax, turnOutsYMax) + 50;
      width.value = Math.max(linesXMax, turnOutsXMax) + 50;
      lastUpdated.value = new Date().getTime();
    });

    onUnmounted(() => {
      layoutService.close();
    });

    return {
      getLinePoints: (line: Line, motorControlsDirection: boolean) => {
        const centerX = (line.startNode.x + line.endNode.x) / 2;
        const centerY = (line.startNode.y + line.endNode.y) / 2;
        return motorControlsDirection
          ? `${line.endNode.x},${line.endNode.y} ${centerX},${centerY} ${line.startNode.x},${line.startNode.y}`
          : `${line.startNode.x},${line.startNode.y} ${centerX},${centerY} ${line.endNode.x},${line.endNode.y}`;
      },
      switchTurnOut: (turnOut: TurnOut) => {
        turnOut.turnedOut = !turnOut.turnedOut;
        layoutService.updatePointsControlState();
      },
      config,
      height,
      lastUpdated,
      motorControlState,
      width,
    };
  },
});
</script>
