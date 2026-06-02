import { Object3D, Color } from 'three';
import AnimatedMeshLine from './AnimatedMeshLine';

const rndFloat = (min, max) => Math.random() * (max - min) + min;
const rndItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const COLORS = ['#dc202e', '#f7ed99', '#2d338b', '#76306b', '#ea8c2d'].map(c => new Color(c));

const RADIUS_START = 0.3;
const RADIUS_START_MIN = 0.1;
const Z_MIN = -1;
const Z_INCREMENT = 0.08;
const ANGLE_INCREMENT = 0.025;
const RADIUS_INCREMENT = 0.02;
const FREQUENCY = 0.9;
const MAX_LINES = 400;

export default class LineGenerator extends Object3D {
  constructor(cameraZ = 6) {
    super();
    this.cameraZ = cameraZ;
    this.isStarted = false;
    this.lines = [];
  }

  start() {
    this.isStarted = true;
  }

  stop() {
    this.isStarted = false;
  }

  addLine() {
    if (this.lines.length >= MAX_LINES) return;

    let z = Z_MIN;
    let radius = Math.random() > 0.8 ? RADIUS_START_MIN : RADIUS_START;
    let angle = rndFloat(0, Math.PI * 2);
    const points = [];

    while (z < this.cameraZ) {
      points.push(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      z += Z_INCREMENT;
      angle += ANGLE_INCREMENT;
      radius += RADIUS_INCREMENT;
    }

    const line = new AnimatedMeshLine({
      points,
      visibleLength: rndFloat(0.1, 0.4),
      speed: rndFloat(0.001, 0.005),
      color: rndItem(COLORS),
    });

    this.lines.push(line);
    this.add(line);
    return line;
  }

  update() {
    if (this.isStarted && Math.random() < FREQUENCY) this.addLine();

    const alive = [];
    for (const line of this.lines) {
      line.update();
      if (line.isDied()) {
        this.remove(line);
      } else {
        alive.push(line);
      }
    }
    this.lines = alive;
  }
}
