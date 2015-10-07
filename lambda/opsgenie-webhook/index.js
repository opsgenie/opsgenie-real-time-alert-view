var pubnub = {}

var publishKey = "<PUBNUB Publish Key>";
var subscribeKey = "<PUBNUB Subscribe Key>";
var channelId = "<PUBNUB Channel Id>";

/*
**  Publishes given event to the PUBNUB channel
*/
function publishEventOnPubnub(event, context) {
    pubnub.publish({ 
        channel   : channelId,
        message   : event,
        callback  : function(e) 
                    { 
                        context.succeed(JSON.stringify(event)); 
                    },
        error     : function(e) 
                    { 
                        console.log( "FAILED!" + JSON.stringify(event), e );
                        context.done(new Error("Publish Error Occured"));
                    }
    });
}

/*
**  AWS Lambda handler for OpsGenie Webhook access
**  Initialize PUBNUB with publishKey, subscribeKey, channelId parameters
**  @event: Data comes from OpsGenie Webhook integration
**  Uses PUBNUB javascript library.
*/
exports.handler = function(event, context) {
    pubnub = require("pubnub")({
        publish_key   : publishKey,
        subscribe_key: subscribeKey
    });

    publishEventOnPubnub(event, context);
}