import {
  Line,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  Color,
} from 'three';

export default class AnimatedMeshLine extends Line {
  constructor({
    speed = 0.002,
    visibleLength = 0.3,
    color = new Color('#ffffff'),
    opacity = 1,
    points = [],
  } = {}) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
    geometry.setDrawRange(0, 0);

    super(geometry, new LineBasicMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
    }));

    this.totalPoints = points.length / 3;
    this.speed = speed;
    this.visibleLength = visibleLength;
    this.currentOffset = 0;
  }

  update() {
    this.currentOffset += this.speed;

    const startFrac = Math.max(0, this.currentOffset - this.visibleLength);
    const start = Math.floor(startFrac * this.totalPoints);
    const end = Math.ceil(Math.min(this.currentOffset, 1) * this.totalPoints);
    this.geometry.setDrawRange(start, Math.max(0, end - start));

    if (this.isDying()) {
      this.material.opacity = Math.max(0, 1 - (this.currentOffset - 1) / this.visibleLength);
    }
  }

  isDied() {
    return this.currentOffset > 1 + this.visibleLength;
  }

  isDying() {
    return this.currentOffset > 1;
  }
}
