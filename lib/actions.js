'use strict';

var Homey = require('homey');

exports.init = function (){
	let setAlertModeAction =  new Homey.FlowCardAction('alert_mode');
    setAlertModeAction
        .register()
        .registerRunListener((args, state)=>{
            console.log('Initiating alert_mode');
            //console.log(args);
            var driver = Homey.ManagerDrivers.getDriver(args.device.__driver.id);
            //console.log(driver);
            //if (driver.setChargingPoleStatus(args) == true)
                //Homey.app.log('ChargingPole.Activated');
            //else
                //Homey.app.log('ChargingPole.DeActivated');
            return args.device.setCapabilityValue('onoff', 0);
            //return Promise.resolve();
            //return args.device.setCapabilityValue('onoff', 1);
        });
};