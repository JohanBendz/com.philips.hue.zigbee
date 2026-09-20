'use strict';

const { ZigBeeDriver } = require('homey-zigbeedriver');

// ZigBeeDriver shares the physical ZCL node between the two Homey devices.
class HueDymeraDriver extends ZigBeeDriver {}

module.exports = HueDymeraDriver;
