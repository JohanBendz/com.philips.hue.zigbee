'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Cluster, BoundCluster } = require('zigbee-clusters');
const { loadDriver } = require('./helpers');

test('Hue driver initialization only registers actual Cluster subclasses', () => {
  const original = Cluster.addCluster;
  const registrations = [];

  Cluster.addCluster = function instrumentAddCluster(implementation) {
    registrations.push(implementation);
    return original.call(this, implementation);
  };

  try {
    // Loading actual light and remote drivers exercises both historic sites.
    loadDriver('LWA001');
    loadDriver('RDM002');
  } finally {
    Cluster.addCluster = original;
  }

  assert.ok(registrations.length > 0, 'expected actual Hue cluster registration');
  for (const implementation of registrations) {
    assert.ok(
      implementation.prototype instanceof Cluster,
      `${implementation.name} must extend Cluster to be globally registered`,
    );
    assert.equal(
      implementation.prototype instanceof BoundCluster,
      false,
      `${implementation.name} is a BoundCluster and must only be bound to an endpoint`,
    );
  }
});
