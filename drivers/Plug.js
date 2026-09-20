"use strict";

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');

// Power On Behaviour need these
const HueSpecificOnOffCluster = require('../lib/HueSpecificOnOffCluster');
Cluster.addCluster(HueSpecificOnOffCluster);

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
                await onOffCluster.readAttributes(['powerOnCtrl']);
                await onOffCluster.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_state}); // default: On (On, Off, 255 = Recover)
                this.log("Power On Control supported by device");
            } catch (error) {
                this.log("This device does not support Power On Control");
            }

        }
    
    }
}

module.exports = Plug;
