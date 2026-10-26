'use strict';

const { CLUSTER } = require('zigbee-clusters');

const REPORT_CONFIG = Object.freeze({ minInterval: 0, maxInterval: 300, minChange: 1 });

// The SDK's onoff capability already consumes attr.onOff. This adds a
// separate observation-only listener, never a second capability write.
function startHuePlugReportLab(device, cluster, { mode, endpointId }) {
  if (mode !== 'passive' && mode !== 'configure') {
    throw new RangeError('Hue plug report lab: unsupported mode');
  }
  if (!Number.isInteger(endpointId)) {
    throw new TypeError('Hue plug report lab: numeric On/Off endpoint required');
  }
  let totalReports = 0;
  let validReports = 0;
  let lastReportAt = null;
  const onReport = value => {
    totalReports++;
    const valid = typeof value === 'boolean' || value === 0 || value === 1;
    if (valid) validReports++;
    const now = Date.now();
    const delta = lastReportAt === null ? 'first' : String(now - lastReportAt);
    lastReportAt = now;
    // No device IEEE address, network key, device tokens or raw frame data.
    device.log(`[LOM002 report lab] attr.onOff=${String(value)} valid=${valid} reportCount=${totalReports} intervalMs=${delta}`);
  };
  cluster.on('attr.onOff', onReport);
  device.log(`[LOM002 report lab] mode=${mode} endpoint=${endpointId}; original 15000ms poll retained`);

  // Opt-in only, on a separately paired experimental plug. Binding [0x0006]
  // in the lab manifest is only applied by Homey during NEW pairing.
  const ready = mode === 'configure'
    ? Promise.resolve()
      .then(() => device.configureAttributeReporting([{
        endpointId,
        cluster: CLUSTER.ON_OFF,
        attributeName: 'onOff',
        ...REPORT_CONFIG,
      }]))
      .then(() => device.log('[LOM002 report lab] configureAttributeReporting accepted'))
      .catch(err => device.error('[LOM002 report lab] configureAttributeReporting failed; original polling retained', err))
    : Promise.resolve();

  return {
    ready,
    snapshot() { return { totalReports, validReports, lastReportAt }; },
    stop() { cluster.removeListener('attr.onOff', onReport); },
  };
}

module.exports = { startHuePlugReportLab, REPORT_CONFIG };
