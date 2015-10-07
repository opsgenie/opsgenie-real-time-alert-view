var https = require('https');

/*
**  Request timeout
*/
var timeout = 3000;

/*
**  Sets options for OpsGenie Api request with the given apiKey and limit parameters
**  @apiKey: OpsGenie Api Integration Key
*/
function getReqOpts(apiKey) {
    return { host :  'api.opsgenie.com',
        port : 443,
        path: '/v1/json/user?apiKey=' + apiKey,
        method : 'GET'
    }
}

/*
**  Make a call to the OpsGenie API with the given parameters
*/
function callOpsgenieApi(apiKey, context) {
    var options = getReqOpts(apiKey);
    var req = https.request(options, function(res) {
        res.on('data', function (chunk) {
            if (res.statusCode === 201 || res.statusCode === 200) {
                context.succeed(JSON.parse(chunk));
            } else {
                context.done(new Error("FAILED!" + JSON.stringify(options)));
            }
        });
    });
 
    req.end();

    req.on('error', function (err) {
        context.done(new Error(' Request error: ' + err.message));
    });
    req.setTimeout(timeout, function () {
        context.done(new Error(' Request timeout after ' + timeout + ' milliseconds.'));
    });
}

/*
**  AWS Lambda handler for OpsGenie API access
**  @apiKey: OpsGenie Api Integration Key 
*/
exports.handler = function(event, context) {
    
    var apiKey = event.apiKey;
    
    if (apiKey === undefined || apiKey === null) {
        context.done(new Error('Opsgenie Api Key Must be Given'));
    } else {
        callOpsgenieApi(apiKey, context);
    }

};