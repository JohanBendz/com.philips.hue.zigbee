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

// Level control move: rate is in brightness steps per second, on the 1-254 Zigbee scale
const DEFAULT_DIM_RATE = 50;
const MAX_DIM_RATE = 254;
// Zigbee brightness scale, mapped onto Homey's 0-1 dim capability
const MAX_LEVEL = 254;
// Longest a move can realistically run (254 steps at rate 1) before we forget about it
const DIM_MOVE_MAX_DURATION = 255000;
// Give the light a moment to settle before reading back the level it stopped at
const LEVEL_READBACK_DELAY = 500;

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

    // Start a continuous dim with the LevelControl move command. The light keeps moving
    // on its own until it is stopped or reaches its end stop, so a hold-and-release only
    // costs two Zigbee commands instead of a stream of dim steps.
    async startDim(args) {
        const moveMode = args.direction === 'down' ? 'down' : 'up';
        const rate = Math.min(MAX_DIM_RATE, Math.max(1, Math.round(Number(args.rate) || DEFAULT_DIM_RATE)));

        // Hue switches repeat their hold event several times per second. Re-sending the
        // same move would only restart it, so ignore it while this move is still running.
        if (this._dimMoveMode === moveMode) return;

        this._clearDimMove();
        this._dimMoveMode = moveMode;
        // A release can get lost; do not let that block the next move forever.
        this._dimMoveTimeout = this.homey.setTimeout(() => this._clearDimMove(), DIM_MOVE_MAX_DURATION);

        this.log(`startDim, moveMode=${moveMode} rate=${rate}`);
        await this.levelControlCluster.moveWithOnOff({ moveMode, rate });
    }

    async stopDim() {
        this._clearDimMove();
        this.log('stopDim');
        await this.levelControlCluster.stopWithOnOff();
        await this._syncLevel();
    }

    _clearDimMove() {
        if (this._dimMoveTimeout) {
            this.homey.clearTimeout(this._dimMoveTimeout);
            this._dimMoveTimeout = null;
        }
        this._dimMoveMode = null;
    }

    // The light picked its own brightness during the move, so read back where it ended up.
    async _syncLevel() {
        try {
            await this.sleep(LEVEL_READBACK_DELAY);
            const { currentLevel } = await this.levelControlCluster.readAttributes(['currentLevel']);
            if (typeof currentLevel !== 'number') return;

            await this.setCapabilityValue('dim', Math.min(1, Math.max(0, currentLevel / MAX_LEVEL)));

            if (this.hasCapability('onoff')) {
                const { onOff } = await this.onOffCluster.readAttributes(['onOff']).catch(() => ({}));
                await this.setCapabilityValue('onoff', typeof onOff === 'boolean' ? onOff : currentLevel > 0);
            }
        } catch (error) {
            this.error('Error reading back level after dim move', error);
        }
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
                const powerOnCtrlstate = await this.zclNode.endpoints[11].clusters.onOff.readAttributes(['powerOnCtrl']);
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


