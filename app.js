"use strict";

const Homey = require("homey");
var FlowActions = require("./lib/actions.js");

class PhilipsHueApp extends Homey.App {
  onInit() {
    this.log("Philips Hue app initiating...");
    //FlowActions.init();
  }
}

module.exports = PhilipsHueApp;
