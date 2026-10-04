'use strict';

const Plug = require('../Plug.js');
const { CLUSTER } = require('zigbee-clusters');
const { startHuePlugReportLab } = require('../../lib/HuePlugReportLab');

// EXPERIMENTAL BRANCH ONLY. Production Plug.js and its 15-second polling
// remain completely unchanged; do not merge this lab into the live driver.
class LOM002 extends Plug {
  async onNodeInit({ zclNode }) {
    await super.onNodeInit({ zclNode });

    const mode = process.env.HUE_PLUG_REPORT_LAB;
    if (mode !== 'passive' && mode !== 'configure') return;

    const endpointId = this.getClusterEndpoint(CLUSTER.ON_OFF);
    const cluster = zclNode.endpoints[endpointId]?.clusters?.[CLUSTER.ON_OFF.NAME];
    if (!cluster) {
      this.error('[LOM002 report lab] On/Off cluster unavailable; polling unchanged.');
      return;
    }
    this._plugReportLab = startHuePlugReportLab(this, cluster, { mode, endpointId });
    await this._plugReportLab.ready;
  }

  async onUninit() {
    this._plugReportLab?.stop();
    if (typeof super.onUninit === 'function') await super.onUninit();
  }
}

module.exports = LOM002;
