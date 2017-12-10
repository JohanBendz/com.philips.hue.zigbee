'use strict';

var Homey = require('homey');

exports.init = function (){
    
    // new Homey.FlowCardAction('alarm_mode')
    // .register()
    // .registerRunListener(args => function(args){
    //     console.log('entering flow card action alarm mode')
    //     args.device.getDriver().setCapabilityValue('onoff', false)
    // });

    console.log('registering flow');
    let setAlertModeAction =  new Homey.FlowCardAction('alarm_mode');
    setAlertModeAction
        .register()
        .registerRunListener((args, state)=>{
            console.log('Initiating alert_mode');
            //console.log(args);
            var driver = Homey.ManagerDrivers.getDriver(args.device.__driver.id);
            console.log(driver);
            //if (driver.setChargingPoleStatus(args) == true)
                //Homey.app.log('ChargingPole.Activated');
            //else
                //Homey.app.log('ChargingPole.DeActivated');
            return args.device.setCapabilityValue('onoff', false);
            //return Promise.resolve(true);
            //return args.device.setCapabilityValue('onoff', 1);
        });
};