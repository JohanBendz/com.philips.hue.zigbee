'use strict';

const { EventEmitter } = require('node:events');
const Module = require('node:module');
const path = require('node:path');

// Homey's SDK is injected on the hub, not installed in the app. Mock only that
// boundary; load the real pinned Zigbee libraries and actual app driver classes.
class Device extends EventEmitter {
  constructor() {
    super();
    this.data = { id: 'node-a' };
    this.store = {};
    this.values = {};
    this.settings = { mode: 'dualpushbutton' };
    this.errors = [];
    this.capabilities = new Set(['measure_battery']);
  }
  getData() { return this.data; }
  getStoreValue(key) { return this.store[key] ?? null; }
  async setStoreValue(key, value) { this.store[key] = value; }
  getSetting(key) { return this.settings[key]; }
  getSettings() { return this.settings; }
  getCapabilityValue(key) { return this.values[key] ?? null; }
  hasCapability(key) { return this.capabilities.has(key); }
  async addCapability(key) { this.capabilities.add(key); }
  async setCapabilityValue(key, value) { this.values[key] = value; }
  async setAvailable() {}
  log() {}
  debug() {}
  error(...args) { this.errors.push(args); }
}

function loadDriver(id) {
  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (request === 'homey') return { Device, Driver: class {} };
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(path.resolve(__dirname, '../drivers', id, 'device.js'));
  } finally {
    Module._load = originalLoad;
  }
}

function remote(id, data = { id: 'node-a' }) {
  const Driver = loadDriver(id);
  const device = new Driver();
  const calls = [];
  const frames = [];
  const node = {
    handleFrame(...args) { frames.push({ receiver: this, args }); },
  };
  const card = {
    registerRunListener(fn) { this.listener = fn; return this; },
    async trigger(target, tokens, state) { calls.push({ target, tokens, state }); },
  };
  Object.assign(device, {
    data,
    homey: {
      zigbee: { getNode: async () => node },
      flow: { getDeviceTriggerCard: () => card },
    },
    zclNode: { endpoints: { 1: { clusters: {
      HueSpecificBasicCluster: { writeAttributes: async () => {} },
    } } } },
    registerCapability() {},
    isFirstInit: () => false,
    driver: { getDevices: () => [device] },
  });
  return { device, node, card, calls, frames };
}

function buttonFrame(input, action) {
  const frame = Buffer.alloc(10);
  frame[5] = input;
  frame[9] = action;
  return frame;
}

module.exports = { loadDriver, remote, buttonFrame };
