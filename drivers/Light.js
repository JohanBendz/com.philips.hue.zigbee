"use strict";

const { ZigBeeLightDevice } = require('homey-zigbeedriver');

/* const { Cluster, debug, CLUSTER } = require('zigbee-clusters');
const HueSpecificOnOffCluster = require('../lib/HueSpecificOnOffCluster');
const HueSpecificLevelControlCluster = require('../lib/HueSpecificLevelControlCluster');
// const HueSpecificColorControlCluster = require('../lib/HueSpecificColorControlCluster');

Cluster.addCluster(HueSpecificOnOffCluster);
Cluster.addCluster(HueSpecificLevelControlCluster);
// Cluster.addCluster(HueSpecificColorControlCluster); */

class Light extends ZigBeeLightDevice {

 	async onNodeInit({zclNode}) {

        await super.onNodeInit({zclNode});

//        this.enableDebug();
//		debug(true);
        this.printNode();

/*         const powerOn_OnOff_Value = await zclNode.endpoints[11].clusters.onOff.readAttributes('powerOnCtrl');
        const powerOn_LevelControl_Value = await zclNode.endpoints[11].clusters.levelControl.readAttributes('powerOnCtrl');
        // const powerOn_ColorControl_Value = await zclNode.endpoints[11].clusters.colorControl.readAttributes('powerOnCtrl');

        this.log("Startup, Power On - OnOff value: ", powerOn_OnOff_Value.powerOnCtrl);
        this.log("Startup, Power On - Level Control value: ", powerOn_LevelControl_Value.powerOnCtrl);
        // this.log("Power On - Color Control value: ", powerOn_ColorControl_Value);

        let settings = await this.getSettings();
        this.setSettings({
            powerOnCtrl_state: powerOn_OnOff_Value.powerOnCtrl,
            powerOnCtrl_dimvalue: powerOn_LevelControl_Value.powerOnCtrl,
        }).catch(this.error); */

    }

/*     async onSettings( oldSettings, newSettings, changedKeys ) {

        // check and update settings
		if (changedKeys && changedKeys.length) {
			for (var i=0; i<changedKeys.length;i++){
				if (changedKeys[i] == 'powerOnCtrl_state') {
                    this.log('powerOnCtrl_state changed from ' + oldSettings.powerOnCtrl_state + ' to ' + newSettings.powerOnCtrl_state);
                    this.setSettings({
                        powerOnCtrl_state: newSettings.powerOnCtrl_state,
                    }).catch(this.error);
				}					
				if (changedKeys[i] == 'powerOnCtrl_dimvalue') {
                    this.log('powerOnCtrl_dimvalue changed from ' + oldSettings.powerOnCtrl_dimvalue + ' to ' + newSettings.powerOnCtrl_dimvalue);
                    this.setSettings({
                        powerOnCtrl_dimvalue: newSettings.powerOnCtrl_dimvalue,
                    }).catch(this.error);
				}
			}
		}

         this.setSettings({
            powerOnCtrl_state: powerOn_OnOff_Value.powerOnCtrl,
            powerOnCtrl_dimvalue: powerOn_LevelControl_Value.powerOnCtrl,
        }).catch(this.error);

        let settings = await this.getSettings();
        this.log("On Settings Change, new Power On - OnOff value: ", settings.powerOnCtrl_state);
        this.log("On Settings Change, newPower On - Level Control value: ", settings.powerOnCtrl_dimvalue); 

         const powerOn_OnOff_Value = newSettingsObj.powerOnCtrl_state = 'on' ? 1 : newSettingsObj.powerOnCtrl_state = 'off' ? 0 : 255; 
        await zclNode.endpoints[11].clusters.onOff.writeAttributes({powerOnCtrl: powerOn_OnOff_Value}); // default: 1. 1 = On, 0 = Off, 255 = Recover
        await zclNode.endpoints[11].clusters.levelControl.writeAttributes({powerOnCtrl: newSettingsObj.powerOnCtrl_dimvalue}); // default: 255
        //  await zclNode.endpoints[11].clusters.colorControl.writeAttributes({powerOnCtrl: 0}); // default: 366

        const new_powerOn_OnOff_Value = await zclNode.endpoints[11].clusters.onOff.readAttributes('powerOnCtrl');
        const new_powerOn_LevelControl_Value = await zclNode.endpoints[11].clusters.levelControl.readAttributes('powerOnCtrl');
        // const powerOn_ColorControl_Value = await zclNode.endpoints[11].clusters.colorControl.readAttributes('powerOnCtrl');

        this.log("On Settings Change, new Power On - OnOff value: ", new_powerOn_OnOff_Value);
        this.log("On Settings Change, newPower On - Level Control value: ", new_powerOn_LevelControl_Value);
        // this.log("Power On - Color Control value: ", powerOn_ColorControl_Value);

    } */

}

module.exports = Light;
