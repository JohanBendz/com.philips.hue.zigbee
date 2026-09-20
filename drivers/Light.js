"use strict";

const { ZigBeeLightDevice } = require('homey-zigbeedriver');

const { Cluster, CLUSTER } = require('zigbee-clusters');

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

const DEFAULT_DIM_RATE = 50;
const MAX_DIM_RATE = 254;
const MAX_LEVEL = 254;
const DIM_MOVE_MAX_DURATION = 255000;
const LEVEL_READBACK_DELAY = 500;

class Light extends ZigBeeLightDevice {

 	async onNodeInit({zclNode}) {

        await super.onNodeInit({zclNode});
    }

    // Sleep for blink
    sleep(milliseconds) {
        return new Promise(resolve => this.homey.setTimeout(resolve, milliseconds));
    }

    async blink(args) {
        const blinktype = args.blink_type === 'long' ? 2000 : 1000;
        for (let i = 0; i < args.blinks; i++) {
            await this.onOffCluster.toggle();
            await this.sleep(blinktype);
            await this.onOffCluster.toggle();
            await this.sleep(blinktype);
        }
    }

    async alert(args) {
        const blinktype = args.alert_mode === 'blink' ? 0 : args.alert_mode === 'breath' ? 1 : args.alert_mode === 'okay' ? 2 : args.alert_mode === 'channel_change' ? 11 : args.alert_mode === 'finish_effect' ? 254 : 255;
        const identifyEndpoint = this.getClusterEndpoint(CLUSTER.IDENTIFY);
        if (identifyEndpoint === null) {
            throw new Error('missing_identify_cluster');
        }

        await this.zclNode.endpoints[identifyEndpoint].clusters[CLUSTER.IDENTIFY.NAME].triggerEffectId({
            effectId: blinktype,
            effectVariant: 0
        });
    }



    async startDim(args) {
        const moveMode = args.direction === 'down' ? 'down' : 'up';
        const rate = Math.min(MAX_DIM_RATE, Math.max(1, Math.round(Number(args.rate) || DEFAULT_DIM_RATE)));

        if (this._dimMoveMode === moveMode) {
            return;
        }

        this._clearDimMove();
        this._dimMoveMode = moveMode;
        this._dimMoveTimeout = this.homey.setTimeout(() => this._clearDimMove(), DIM_MOVE_MAX_DURATION);

        this.log(`startDim, moveMode=${moveMode} rate=${rate}`);
        try {
            await this.levelControlCluster.moveWithOnOff({ moveMode, rate });
        } catch (err) {
            this._clearDimMove();
            throw err;
        }
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

    async _syncLevel() {
        try {
            await this.sleep(LEVEL_READBACK_DELAY);
            const { currentLevel } = await this.levelControlCluster.readAttributes(['currentLevel']);
            if (typeof currentLevel !== 'number') {
                return;
            }

            await this.setCapabilityValue('dim', Math.min(1, Math.max(0, currentLevel / MAX_LEVEL)));

            if (this.hasCapability('onoff')) {
                const { onOff } = await this.onOffCluster.readAttributes(['onOff']).catch(() => ({}));
                await this.setCapabilityValue(
                    'onoff',
                    typeof onOff === 'boolean' ? onOff : currentLevel > 0
                );
            }
        } catch (error) {
            this.error('Error reading back level after dim move', error);
        }
    }

    async onSettings({ oldSettings, newSettings, changedKeys }) {
       
        if (changedKeys.includes('powerOnCtrl_state') || changedKeys.includes('powerOnCtrl_dimvalue') || changedKeys.includes('powerOnCtrl_colorvalue')) {

            try {
                await this.onOffCluster.readAttributes(['powerOnCtrl']);
                await this.onOffCluster.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_state}); // default: On (On, Off, 255 = Recover)
                await this.levelControlCluster.writeAttributes({powerOnCtrl: newSettings.powerOnCtrl_dimvalue}); // default: 255 (0-255)
                this.log("Power On Control supported by device");
            } catch (error) {
                this.log("This device does not support Power On Control");
            }

            const colorTempMin = this.getStoreValue('colorTempMin');
            const colorTempMax = this.getStoreValue('colorTempMax');
            if (colorTempMin && colorTempMax && typeof newSettings.powerOnCtrl_colorvalue === 'number') {
                let colorValue = newSettings.powerOnCtrl_colorvalue;
                if (colorValue > colorTempMax) {
                    colorValue = colorTempMax;
                    this.log("Setting Power On Control, value above limits");
                } else if (colorValue < colorTempMin) {
                    colorValue = colorTempMin;
                    this.log("Setting Power On Control, value below limits");
                } else {
                    this.log("Setting Power On Control, value within limits");
                }

                await this.colorControlCluster.writeAttributes({powerOnCtrl: colorValue});
                this.log("Color Temperature supported by device. Min Mireds: ", colorTempMin,". Max Mireds: ", colorTempMax);
            } else {
                this.log("This device does not support Color Temperature");
            }

        }
    
    }

    async onUninit() {
        this._clearDimMove();
        if (typeof super.onUninit === 'function') {
            return super.onUninit();
        }
    }

}

module.exports = Light;


