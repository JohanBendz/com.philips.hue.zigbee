const { IdentifyCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificIdentifyCluster extends IdentifyCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,

    };
  }

  static get COMMANDS() {
    return {
      ...super.COMMANDS,
      triggerEffectId: {
        id: 64, //0x40
        args: {
          effectId: ZCLDataTypes.enum8({
            blink: 0, //0x00
            breath: 1, //0x01
            okay: 2, //0x02
            channelChange: 11, //0xb
            finishEffect: 254, //0xfe
            stopEffect: 255, //0xff
          }),
          effectVariant: ZCLDataTypes.uint8,
        }
      },

    };
  }

}

module.exports = HueSpecificIdentifyCluster;

/*        blink: ZCLDataTypes.uint8, //0x00
          breath: ZCLDataTypes.uint8, //0x01
          okay: ZCLDataTypes.uint8, //0x02
          channelChange:  ZCLDataTypes.uint8, // 0xb
          finishEffect:  ZCLDataTypes.uint8, // 0xfe
          stopEffect:  ZCLDataTypes.uint8, // 0xff */


// teZCL_Status eCLD_IdentifyCommandTriggerEffectSend(
// uint8 u8SourceEndPointId,
// uint8 u8DestinationEndPointId,
// tsZCL_Address *psDestinationAddress,
// uint8 *pu8TransactionSequenceNumber,
// teCLD_Identify_EffectId eEffectId,
// uint8 u8EffectVariant);

// Effect Command       Description
// - Blink              Light is switched on and then off (once)
// - Breathe            Light is switched on and off by smoothly increasing and then decreasing its brightness over a one-second period, and then this is repeated 15 times
// - Okay               • Colour light goes green for one second
//                      • Monochrome light flashes twice in one second
// - Channel change     • Colour light goes orange for 8 seconds
//                      • Monochrome light switches to maximum brightness for 0.5 s and then to  minimum brightness for 7.5 s
// - Finish effect      Current stage of effect is completed and then identification mode is terminated (e.g. for the Breathe effect, only the current one-second cycle will be completed)
// - Stop effect        Current effect and identification mode are terminated as soon as possible
