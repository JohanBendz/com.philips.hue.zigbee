'use strict';

const { ZigBeeLightDevice } = require('homey-zigbeedriver');

class HueSlimLightDevice extends ZigBeeLightDevice {

    async onNodeInit() {
        super.onNodeInit();
        
        // Der Slim-Spot nutzt die Standard-Logik von ZigBeeLightDevice
        // für Ein/Aus, Dimmen, Farbe und Farbtemperatur.
    }

}

module.exports = HueSlimLightDevice;
