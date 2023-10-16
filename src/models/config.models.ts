import { Dictionary } from 'lodash';

export interface Config {
  lines: Line[];
  topics: Dictionary<string>;
  turnOuts: TurnOut[];
}

export interface Line {
  endNode: Node;
  motorControlId: number;
  startNode: Node;
}

export interface Node {
  x: number;
  y: number;
}

export interface TurnOut {
  commonNode: Node;
  forwardNode: Node;
  forwardPin: number;
  turnedOut?: boolean;
  turnOutNode: Node;
  turnOutPin: number;
}
