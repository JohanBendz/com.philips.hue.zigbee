"use strict";

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');
const { toStandardStartupState } = require('../lib/HuePowerOnStartup');

class Plug extends ZigBeeDevice {

    async onNodeInit({zclNode}) {
        if (this.hasCapability('onoff')) this.registerCapability('onoff', CLUSTER.ON_OFF, {
			getOpts: {
				pollInterval: 15000,
				getOnOnline: true,
			},
		});
    }

	async onSettings({ oldSettings, newSettings, changedKeys }) {
       
        if (changedKeys.includes('powerOnCtrl_state')) {

            try {
                const onOffEndpoint = this.getClusterEndpoint(CLUSTER.ON_OFF);
                if (onOffEndpoint === null) {
                    throw new Error('missing_on_off_cluster');
                }

                const onOffCluster = this.zclNode.endpoints[onOffEndpoint].clusters[CLUSTER.ON_OFF.NAME];
                await onOffCluster.readAttributes(['startUpOnOff']);
                await onOffCluster.writeAttributes({ startUpOnOff: toStandardStartupState(newSettings.powerOnCtrl_state) }); // recover -> previous (0xFF)
                this.log("Power On Control supported by device");
            } catch (error) {
                this.log("This device does not support Power On Control");
            }

        }
    
    }
}

module.exports = Plug;
