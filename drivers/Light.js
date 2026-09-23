"use strict";

const { ZigBeeLightDevice } = require('homey-zigbeedriver');

const { Cluster, CLUSTER } = require('zigbee-clusters');

// Power On Behaviour need these
const HueSpecificOnOffCluster = require('../lib/HueSpecificOnOffCluster');
const HueSpecificLevelControlCluster = require('../lib/HueSpecificLevelControlCluster');
const HueSpecificColorControlCluster = require('../lib/HueSpecificColorControlCluster');
const HueSpecificPhilips2Cluster = require('../lib/HueSpecificPhilips2Cluster');
Cluster.addCluster(HueSpecificOnOffCluster);
Cluster.addCluster(HueSpecificLevelControlCluster);
Cluster.addCluster(HueSpecificColorControlCluster);
Cluster.addCluster(HueSpecificPhilips2Cluster);

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
const DEFAULT_TRANSITION_DURATION_MS = 400;

class Light extends ZigBeeLightDevice {

 	async onNodeInit({zclNode}) {

        await super.onNodeInit({zclNode});
        this._registerStateReportListeners();
    }

    _registerStateReportListeners() {
        this._removeStateReportListeners();

        try {
            const onOffEndpoint = this.getClusterEndpoint(CLUSTER.ON_OFF);
            const onOffCluster = onOffEndpoint === null
                ? null
                : this.zclNode.endpoints[onOffEndpoint]?.clusters?.[CLUSTER.ON_OFF.NAME];

            if (onOffCluster?.on) {
                this._onOffReportListener = (value) => {
                    if (typeof value === 'boolean') {
                        this.setCapabilityValue('onoff', value)
                            .catch(err => this.error('Failed to sync reported on/off state:', err));
                    }
                };
                onOffCluster.on('attr.onOff', this._onOffReportListener);
                this._onOffReportCluster = onOffCluster;
            }
        } catch (error) {
            this.log('Could not register on/off report listener:', error);
        }

        try {
            const levelEndpoint = this.getClusterEndpoint(CLUSTER.LEVEL_CONTROL);
            const levelCluster = levelEndpoint === null
                ? null
                : this.zclNode.endpoints[levelEndpoint]?.clusters?.[CLUSTER.LEVEL_CONTROL.NAME];

            if (levelCluster?.on) {
                this._levelReportListener = (currentLevel) => {
                    if (typeof currentLevel !== 'number' || currentLevel < 0 || currentLevel > MAX_LEVEL) {
                        return;
                    }

                    this.setCapabilityValue('dim', Math.min(1, Math.max(0, currentLevel / MAX_LEVEL)))
                        .catch(err => this.error('Failed to sync reported dim level:', err));
                };
                levelCluster.on('attr.currentLevel', this._levelReportListener);
                this._levelReportCluster = levelCluster;
            }
        } catch (error) {
            this.log('Could not register level report listener:', error);
        }
    }

    _removeStateReportListeners() {
        if (this._onOffReportCluster && this._onOffReportListener) {
            this._onOffReportCluster.removeListener('attr.onOff', this._onOffReportListener);
        }
        if (this._levelReportCluster && this._levelReportListener) {
            this._levelReportCluster.removeListener('attr.currentLevel', this._levelReportListener);
        }

        this._onOffReportCluster = null;
        this._onOffReportListener = null;
        this._levelReportCluster = null;
        this._levelReportListener = null;
    }

    _withDefaultTransition(opts = {}) {
        const options = opts && typeof opts === 'object' ? opts : {};
        if (Number.isFinite(options.duration)) {
            return options;
        }
        return { ...options, duration: DEFAULT_TRANSITION_DURATION_MS };
    }

    changeDimLevel(dim, opts = {}) {
        return super.changeDimLevel(dim, this._withDefaultTransition(opts));
    }

    changeColorTemperature(temperature, opts = {}) {
        return super.changeColorTemperature(temperature, this._withDefaultTransition(opts));
    }

    async changeColor(color, opts = {}) {
        const result = await super.changeColor(color, this._withDefaultTransition(opts));
        // homey-zigbeedriver 2.2.18 has a malformed light_mode capability check
        // in changeColor(), so ensure the capability reflects the command that succeeded.
        if (this.hasCapability('light_mode')) {
            await this.setCapabilityValue('light_mode', 'color');
        }
        return result;
    }

    _hexToHsv(hex) {
        if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) {
            throw new Error('Invalid color value');
        }

        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let hue = 0;
        if (delta !== 0) {
            if (max === r) hue = ((g - b) / delta) % 6;
            else if (max === g) hue = ((b - r) / delta) + 2;
            else hue = ((r - g) / delta) + 4;
            hue /= 6;
            if (hue < 0) hue += 1;
        }

        return {
            hue,
            saturation: max === 0 ? 0 : delta / max,
        };
    }

    async setLightState(args) {
        const brightness = Math.min(1, Math.max(0, Number(args.brightness)));
        if (!Number.isFinite(brightness)) {
            throw new Error('Invalid brightness value');
        }

        const opts = Number.isFinite(args.duration) ? { duration: args.duration } : {};
        if (brightness === 0) {
            await this.changeDimLevel(0, opts);
            await this.setCapabilityValue('dim', 0);
            if (this.hasCapability('onoff')) await this.setCapabilityValue('onoff', false);
            return;
        }

        const { hue, saturation } = this._hexToHsv(args.color);
        await this.changeDimLevel(brightness, opts);
        await this.setCapabilityValue('dim', brightness);
        if (this.hasCapability('onoff')) await this.setCapabilityValue('onoff', true);

        await this.changeColor({ hue, saturation, value: brightness }, opts);
        if (this.hasCapability('light_hue')) await this.setCapabilityValue('light_hue', hue);
        if (this.hasCapability('light_saturation')) await this.setCapabilityValue('light_saturation', saturation);
        if (this.hasCapability('light_mode')) await this.setCapabilityValue('light_mode', 'color');
    }

    async adjustLightTemperature(args) {
        const delta = Number(args.delta);
        if (!Number.isFinite(delta) || delta < -1 || delta > 1) {
            throw new Error('Temperature change must be between -1 and 1');
        }

        const current = Number(this.getCapabilityValue('light_temperature'));
        const base = Number.isFinite(current) ? current : 0.5;
        const target = Math.min(1, Math.max(0, base + delta));
        const opts = Number.isFinite(args.duration) ? { duration: args.duration } : {};

        await this.changeColorTemperature(target, opts);
        await this.setCapabilityValue('light_temperature', target);
        if (this.hasCapability('light_mode')) await this.setCapabilityValue('light_mode', 'temperature');
        return target;
    }

    async setHueEffect(args) {
        const effectPayloads = {
            none: Buffer.from([0x20, 0x00, 0x00]),
            candle: Buffer.from([0x21, 0x00, 0x01, 0x01]),
            fireplace: Buffer.from([0x21, 0x00, 0x01, 0x02]),
        };
        const payload = effectPayloads[args.effect];
        if (!payload) {
            throw new Error('Unsupported Hue effect');
        }

        const endpoint = Object.values(this.zclNode?.endpoints || {})
            .find(item => item.clusters?.[HueSpecificPhilips2Cluster.NAME]);
        if (!endpoint) {
            throw new Error('This Hue light does not support native Candle/Fireplace effects');
        }

        await endpoint.clusters[HueSpecificPhilips2Cluster.NAME].multiColor({ data: payload });

        if (args.effect !== 'none' && this.hasCapability('onoff')) {
            await this.setCapabilityValue('onoff', true);
        }
    }

    _encodeGradientColor(hex) {
        if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) {
            throw new Error('Invalid gradient color value');
        }

        let red = parseInt(hex.slice(1, 3), 16) / 255;
        let green = parseInt(hex.slice(3, 5), 16) / 255;
        let blue = parseInt(hex.slice(5, 7), 16) / 255;
        const gamma = value => value > 0.04045
            ? ((value + 0.055) / 1.055) ** 2.4
            : value / 12.92;
        red = gamma(red);
        green = gamma(green);
        blue = gamma(blue);

        const X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
        const Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
        const Z = red * 0.000088 + green * 0.07231 + blue * 0.986039;
        const sum = X + Y + Z;
        const x = sum === 0 ? 0 : X / sum;
        const y = sum === 0 ? 0 : Y / sum;

        const scaledX = Math.round((x * 4095) / 0.7347)
            .toString(16).padStart(3, '0');
        const scaledY = Math.round((y * 4095) / 0.8264)
            .toString(16).padStart(3, '0');

        return `${scaledX[1]}${scaledX[2]}${scaledY[2]}${scaledX[0]}${scaledY[0]}${scaledY[1]}`;
    }

    _buildThreeColorGradientPayload(colors) {
        if (!Array.isArray(colors) || colors.length !== 3) {
            throw new Error('Hue three-color gradient requires exactly three colors');
        }

        // Philips gradient devices (including Signe) use the reverse physical
        // ordering used by the Hue/Bifrost implementation.
        const encodedColors = [...colors].reverse()
            .map(color => this._encodeGradientColor(color))
            .join('');

        // Bifrost gradient payload:
        // mode 0x0150, header 0x0004, payload length, color count/style,
        // two reserved bytes, scaled colors, segment count, offset.
        return Buffer.from(
            `500104000d30000000${encodedColors}1800`,
            'hex',
        );
    }

    async setHueGradient(args) {
        const endpoint = Object.values(this.zclNode?.endpoints || {})
            .find(item => item.clusters?.[HueSpecificPhilips2Cluster.NAME]);
        if (!endpoint) {
            throw new Error('This Hue light does not support native gradient control');
        }

        const payload = this._buildThreeColorGradientPayload([
            args.color1,
            args.color2,
            args.color3,
        ]);
        await endpoint.clusters[HueSpecificPhilips2Cluster.NAME].multiColor({ data: payload });

        if (this.hasCapability('onoff')) {
            await this.setCapabilityValue('onoff', true);
        }
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
        this._removeStateReportListeners();
        if (typeof super.onUninit === 'function') {
            return super.onUninit();
        }
    }

}

module.exports = Light;


