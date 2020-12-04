"use strict";

const { ZigBeeLightDevice } = require('homey-zigbeedriver');
/* const { Cluster, debug, CLUSTER } = require('zigbee-clusters');
const { HueSpecificOnOffCluster } = require('../lib/HueSpecificOnOffCluster');
const { HueSpecificLevelControlCluster } = require('../lib/HueSpecificLevelControlCluster');

Cluster.addCluster(HueSpecificOnOffCluster);
Cluster.addCluster(HueSpecificLevelControlCluster); */

class Light extends ZigBeeLightDevice {

/* 	async onNodeInit({zclNode}) {

        await super.onNodeInit();

        this.enableDebug();
		debug(true);
        this.printNode();

        const powerOn_OnOff_Value = await zclNode.endpoints[1].clusters.onOff.readAttributes('powerOnCtrl');
        const powerOn_LevelControl_Value = await zclNode.endpoints[1].clusters.levelControl.readAttributes('powerOnCtrl');

        this.log("Power On - OnOff value: ", powerOn_OnOff_Value);
        this.log("Power On - Level Control value: ", powerOn_LevelControl_Value);

    } */

}

module.exports = Light;
