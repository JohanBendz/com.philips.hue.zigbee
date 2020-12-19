"use strict";

const { ZigBeeLightDevice } = require('homey-zigbeedriver');

/* const { ZCLNode, Cluster, debug, CLUSTER } = require('zigbee-clusters');
const HueSpecificOnOffCluster = require('../lib/HueSpecificOnOffCluster');
const HueSpecificLevelControlCluster = require('../lib/HueSpecificLevelControlCluster');
const HueSpecificColorControlCluster = require('../lib/HueSpecificColorControlCluster');

Cluster.addCluster(HueSpecificOnOffCluster);
Cluster.addCluster(HueSpecificLevelControlCluster);
Cluster.addCluster(HueSpecificColorControlCluster); */

class Light extends ZigBeeLightDevice {

 	async onNodeInit({zclNode}) {

        await super.onNodeInit({zclNode});

        this.enableDebug();
//		debug(true);
        this.printNode();

/*         let settings = await this.getSettings();

        await this.zclNode.endpoints[11].clusters.onOff.writeAttributes({powerOnCtrl: settings.powerOnCtrl_state}); // default: On (On, Off, 255 = Recover)
        await this.zclNode.endpoints[11].clusters.levelControl.writeAttributes({powerOnCtrl: settings.powerOnCtrl_dimvalue}); // default: 255 (0-255)
        
        if (this.hasCapability('light_temperature')){
            await this.zclNode.endpoints[11].clusters.colorControl.writeAttributes({powerOnCtrl: settings.powerOnCtrl_colorvalue}); // default: 366 (153-500)
        } */

    }

/*     async onSettings({ oldSettings, newSettings, changedKeys }) {

        await this.zclNode.endpoints[11].clusters.onOff.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_state}); // default: On (On, Off, 255 = Recover)
        await this.zclNode.endpoints[11].clusters.levelControl.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_dimvalue}); // default: 255 (0-255)
        
        if (this.hasCapability('light_temperature')){
        await this.zclNode.endpoints[11].clusters.colorControl.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_colorvalue}); // default: 366 (153-500)
        }
    
    } */

}

module.exports = Light;
