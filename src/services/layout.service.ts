import axios from 'axios';
import { Config } from 'src/models/config.models';
import { MotorControlState } from 'src/models/motor-control.models';
import { Ref } from 'vue';

interface JsonMessage {
  payload: string;
  topic: string;
}

function getWsUrl(path: string) {
  let base;
  if (process.env.CONTROLLER_URL) {
    base = process.env.CONTROLLER_URL;
  } else {
    if (window.location.protocol === 'https:') {
      base = 'wss:';
    } else {
      base = 'ws:';
    }
    base += '//' + window.location.host;
  }

  return new URL(path, base).toString();
}

export class LayoutService {
  config: Ref<Config | undefined>;
  motorControlState: Ref<MotorControlState[] | undefined>;
  socket: WebSocket | undefined = undefined;

  public constructor(
    config: Ref<Config | undefined>,
    motorControlState: Ref<MotorControlState[] | undefined>
  ) {
    this.config = config;
    this.motorControlState = motorControlState;
  }

  public close() {
    this.socket?.close();
  }

  public connect() {
    this.socket = new WebSocket(getWsUrl('/ws/mqtt'));
    this.socket.onmessage = this.onmessage.bind(this);
  }

  public updateMotorControlState() {
    if (!this.config.value) {
      return;
    }

    if (!this.motorControlState.value) {
      return;
    }

    let directions = this.motorControlState.value[0].isReversed ? 2 : 1;
    directions += this.motorControlState.value[1].isReversed ? 8 : 4;

    const value = [
      directions,
      parseInt(this.motorControlState.value[0].speed),
      parseInt(this.motorControlState.value[1].speed),
    ];

    this.socket?.send(
      JSON.stringify({
        payload: JSON.stringify(value),
        topic: this.config.value.topics.motorControl,
      })
    );
  }

  public updatePointsControlState() {
    if (!this.config.value) {
      return;
    }

    let state = 0;
    this.config.value.turnOuts.forEach((turnOut) => {
      const pin = turnOut.turnedOut ? turnOut.turnOutPin : turnOut.forwardPin;
      state += Math.pow(2, pin);
    });

    this.socket?.send(
      JSON.stringify({
        payload: JSON.stringify([state % 0x100, Math.floor(state / 0x100)]),
        topic: this.config.value.topics.pointsControl,
      })
    );
  }

  private onmessage(event: MessageEvent) {
    if (!this.config.value) {
      return;
    }

    if (!event.data) {
      return;
    }

    const content: JsonMessage = JSON.parse(event.data);
    if (!content?.payload) {
      return;
    }

    const value: number[] = JSON.parse(content?.payload);
    if (!Array.isArray(value)) {
      return;
    }

    if (content?.topic == this.config.value.topics.motorControl) {
      this.motorControlState.value = [
        {
          isReversed: (value[0] & 0x02) != 0,
          speed: String(value[1]),
        },
        {
          isReversed: (value[0] & 0x08) != 0,
          speed: String(value[2]),
        },
      ];
    } else if (content?.topic == this.config.value.topics.pointsControl) {
      let pointsState = 0;
      value.forEach((v, i) => {
        pointsState += v * Math.pow(0x100, i);
      });

      this.config.value.turnOuts.forEach((turnOut) => {
        const forwardMatch = Math.pow(2, turnOut.forwardPin);
        const turnOutMatch = Math.pow(2, turnOut.turnOutPin);

        if ((forwardMatch & pointsState) == forwardMatch) {
          turnOut.turnedOut = false;
        }

        if ((turnOutMatch & pointsState) == turnOutMatch) {
          turnOut.turnedOut = true;
        }
      });
    }
  }
}

export const getConfig = async () => {
  const response = await axios.get<Config>('/config.json');
  return response.data;
};
