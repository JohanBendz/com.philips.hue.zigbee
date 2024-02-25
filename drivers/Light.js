"use strict";

const { ZigBeeLightDevice } = require('homey-zigbeedriver');

const { ZCLNode, Cluster, CLUSTER } = require('zigbee-clusters');

// Power On Behaviour need these
const HueSpecificOnOffCluster = require('../lib/HueSpecificOnOffCluster');
const HueSpecificLevelControlCluster = require('../lib/HueSpecificLevelControlCluster');
const HueSpecificColorControlCluster = require('../lib/HueSpecificColorControlCluster');
Cluster.addCluster(HueSpecificOnOffCluster);
Cluster.addCluster(HueSpecificLevelControlCluster);
Cluster.addCluster(HueSpecificColorControlCluster);

// Alert mode need these
const HueSpecificIdentifyCluster = require('../lib/HueSpecificIdentifyCluster');
Cluster.addCluster(HueSpecificIdentifyCluster);
const HueSpecificIdentifyBoundCluster = require('../lib/HueSpecificIdentifyBoundCluster');
Cluster.addCluster(HueSpecificIdentifyBoundCluster);

/* // Dynamic Scenes need these
const HueSpecificCluster = require('../lib/HueSpecificCluster');
Cluster.addCluster(HueSpecificCluster); */

class Light extends ZigBeeLightDevice {

 	async onNodeInit({zclNode}) {

        await super.onNodeInit({zclNode});

        this.printNode();

    }

    // Sleep for blink
    sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    };

    async blink(args) {
        var blinktype = args.blink_type === 'long' ? 2000 : 1000;
        var i;
        for (i = 0; i < args.blinks; i++) {
            await this.zclNode.endpoints[11].clusters.onOff.toggle();
            await this.sleep(blinktype);
            await this.zclNode.endpoints[11].clusters.onOff.toggle();
            await this.sleep(blinktype);
        }
    }

    async alert(args) {
        var blinktype = args.alert_mode === 'blink' ? 0 : args.alert_mode === 'breath' ? 1 : args.alert_mode === 'okay' ? 2 : args.alert_mode === 'channel_change' ? 11 : args.alert_mode === 'finish_effect' ? 254 : 255;
        await this.zclNode.endpoints[11].clusters.identify.triggerEffectId({
            effectId: blinktype,
            effectVariant: 0
        });
    }

/*     async setDynamicScenes(sceneValue) {
        try {
            await this.zclNode.endpoints[11].clusters.hue.dynamicScenes({ scene: sceneValue });
            this.log("Dynamic Scene set successfully");
        } catch (error) {
            this.log("Error setting Dynamic Scene:", error.message);
        }
    } */

/*     async setDynamicScenes(sceneValue) {
        try {
            console.log('Available endpoints:', Object.keys(this.zclNode.endpoints));
            console.log('Endpoint 11 clusters:', this.zclNode.endpoints[11].clusters);
            
            // Assuming 'dynamicScenesCluster' is the cluster that should contain 'dynamicScenes'
            const cluster = this.zclNode.endpoints[11].clusters.dynamicScenesCluster;
            console.log('Cluster:', cluster);
            
            await cluster.dynamicScenes({ scene: sceneValue });
            this.log("Dynamic Scene set successfully");
        } catch (error) {
            this.error("Error setting Dynamic Scene:", error);
        }
    } */
    

    async onSettings({ oldSettings, newSettings, changedKeys }) {
       
        if (changedKeys.includes('powerOnCtrl_state') || changedKeys.includes('powerOnCtrl_dimvalue') || changedKeys.includes('powerOnCtrl_colorvalue')) {

            try {
                const powerOnCtrlstate = await this.zclNode.endpoints[11].clusters.onOff.readAttributes('powerOnCtrl');
                await this.zclNode.endpoints[11].clusters.onOff.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_state}); // default: On (On, Off, 255 = Recover)
                await this.zclNode.endpoints[11].clusters.levelControl.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_dimvalue}); // default: 255 (0-255)
                this.log("Power On Control supported by device");
            } catch (error) {
                this.log("This device does not support Power On Control");
            }

            if (this.getStoreValue('colorTempMin') && this.getStoreValue('colorTempMax')) {
                if (newSettings.powerOnCtrl_colorvalue <= (this.getStoreValue('colorTempMax')) || newSettings.powerOnCtrl_colorvalue >= (this.getStoreValue('colorTempMin'))) {
                    await this.zclNode.endpoints[11].clusters.colorControl.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_colorvalue}); // default: 366
                    this.log("Setting Power On Control, value within limits")
                }
                if (newSettings.powerOnCtrl_colorvalue > this.getStoreValue('colorTempMax')) {
                    await this.zclNode.endpoints[11].clusters.colorControl.writeAttributes({powerOnCtrl: this.getStoreValue('colorTempMax')});
                    this.log("Setting Power On Control, value above limits")
                }
                if (newSettings.powerOnCtrl_colorvalue < this.getStoreValue('colorTempMin')) {
                    await this.zclNode.endpoints[11].clusters.colorControl.writeAttributes({powerOnCtrl: this.getStoreValue('colorTempMin')});
                    this.log("Setting Power On Control, value below limits")
                }
                this.log("Color Temperature supported by device. Min Mireds: ", this.getStoreValue('colorTempMin'),". Max Mireds: ", this.getStoreValue('colorTempMax'));
            } else {
                this.log("This device does not support Color Temperature");
            }

        }
    
    }

}

module.exports = Light;


