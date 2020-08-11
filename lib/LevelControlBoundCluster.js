'use strict';

const { BoundCluster } = require('zigbee-clusters');

class LevelControlBoundCluster extends BoundCluster {

  constructor({
    onStep,
    onStepWithOnOff,
    onMove,
    onStopWithOnOff,
    onStop,
    onMoveWithOnOff,
  }) {
    super();
    this._onStep = onStep;
    this._onStepWithOnOff = onStepWithOnOff;
    this._onMove = onMove;
    this._onStopWithOnOff = onStopWithOnOff;
    this._onStop = onStop;
    this._onMoveWithOnOff = onMoveWithOnOff;
  }

  step(payload) {
    if (typeof this._onStep === 'function') {
      this._onStep(payload);
    }
  }

  stepWithOnOff(payload) {
    if (typeof this._onStepWithOnOff === 'function') {
      this._onStepWithOnOff(payload);
    }
  }

  move(payload) {
    if (typeof this._onMove === 'function') {
      this._onMove(payload);
    }
  }

  moveWithOnOff(payload) {
    if (typeof this._onMoveWithOnOff === 'function') {
      this._onMoveWithOnOff(payload);
    }
  }

  stop() {
    if (typeof this._onStop === 'function') {
      this._onStop();
    }
  }

  stopWithOnOff() {
    if (typeof this._onStopWithOnOff === 'function') {
      this._onStopWithOnOff();
    }
  }

}

module.exports = LevelControlBoundCluster;