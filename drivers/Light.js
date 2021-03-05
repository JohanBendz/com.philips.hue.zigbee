"use strict";

const { ZigBeeLightDevice } = require('homey-zigbeedriver');

const { ZCLNode, Cluster, debug, CLUSTER } = require('zigbee-clusters');
/* const HueSpecificOnOffCluster = require('../lib/HueSpecificOnOffCluster');
const HueSpecificLevelControlCluster = require('../lib/HueSpecificLevelControlCluster');
const HueSpecificColorControlCluster = require('../lib/HueSpecificColorControlCluster');

Cluster.addCluster(HueSpecificOnOffCluster);
Cluster.addCluster(HueSpecificLevelControlCluster);
Cluster.addCluster(HueSpecificColorControlCluster); */

const HueSpecificIdentifyCluster = require('../lib/HueSpecificIdentifyCluster');
Cluster.addCluster(HueSpecificIdentifyCluster);
const HueSpecificIdentifyBoundCluster = require('../lib/HueSpecificIdentifyBoundCluster');
Cluster.addCluster(HueSpecificIdentifyBoundCluster);


class Light extends ZigBeeLightDevice {

 	async onNodeInit({zclNode}) {

        await super.onNodeInit({zclNode});

        this.printNode();

        // Flow action - Blink
        this.startBlinkAction = this.homey.flow.getActionCard('Blink');
        this.startBlinkAction.registerRunListener(async( args, state) => {
            var blinktype = args.blink_type === 'long' ? 2000 : 1000;
            var i;
            for (i = 0; i < args.blinks; i++) {
                await args.device.zclNode.endpoints[11].clusters.onOff.toggle();
                this.sleep(blinktype);
                await args.device.zclNode.endpoints[11].clusters.onOff.toggle();
                this.sleep(blinktype);
            }
        });

        // Flow action - Alert
        this.startAlertAction = this.homey.flow.getActionCard('Alert');
        this.startAlertAction.registerRunListener(async( args, state) => {
            var blinktype = args.alert_mode === 'blink' ? 0 : args.alert_mode === 'breath' ? 1 : args.alert_mode === 'okay' ? 2 : args.alert_mode === 'channel_change' ? 11 : args.alert_mode === 'finish_effect' ? 254 : 255;
            await args.device.zclNode.endpoints[11].clusters.identify.triggerEffectId({
                effectId: blinktype,
                effectVariant: 0
            });
        });

/*         let settings = await this.getSettings();

        await this.zclNode.endpoints[11].clusters.onOff.writeAttributes({powerOnCtrl: settings.powerOnCtrl_state}); // default: On (On, Off, 255 = Recover)
        await this.zclNode.endpoints[11].clusters.levelControl.writeAttributes({powerOnCtrl: settings.powerOnCtrl_dimvalue}); // default: 255 (0-255)
        
        if (this.hasCapability('light_temperature')){
            await this.zclNode.endpoints[11].clusters.colorControl.writeAttributes({powerOnCtrl: settings.powerOnCtrl_colorvalue}); // default: 366 (153-500)
        } */

    }

    // Sleep for blink 
    sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
          if ((new Date().getTime() - start) > milliseconds){
            break;
          }
        }
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
