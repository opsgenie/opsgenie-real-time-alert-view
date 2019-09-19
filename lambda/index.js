var https = require('https');

var publishKey = "<PUBNUB_PUBLISH_KEY>";
var subscribeKey = "<PUBNUB_SUBSCRIBE_KEY>";
var channelId = "<PUBNUB_CHANNEL>";

var pubnub = {}
var alertsOPT = {url: "/v2/alerts", method: 'GET'};
var usersOPT = {url: "/v2/users", method: 'GET'};
var countsOPT = {url: "/v2/alerts/count", method: 'GET'};

var timeout = 3000;

function parseQueryParams(queryParams) {
    var paramKeys = Object.keys(queryParams);
    var params = [];
    paramKeys.forEach(function(key) {
        params.push(key + '=' + queryParams[key]);
    });
    return params.join('&');
}

function getReqOpts(opt, queryParams) {
    var params = parseQueryParams(queryParams);
    var url = opt.url;
    if (params) {
        url = url + '?' + params;
    }

    return {
        host :  'api.opsgenie.com',
        port : 443,
        path: url,
        method: opt.method,
        headers: {
            'Authorization': 'GenieKey ' + queryParams.apiKey
        }
    };
}

function callOpsgenieApi(options, context) {
    var req = https.request(options, function(res) {
        var responseString = '';
        res.on('data', function (chunk) {
            responseString += chunk;
        });

        res.on('end', function () {
            if (res.statusCode === 201 || res.statusCode === 200) {
                context.succeed(JSON.parse(responseString));
            } else {
                context.done(new Error("FAILED!" + JSON.stringify(options)));
            }
        });
    });
    req.on('error', function (err) {
        context.done(new Error(' Request Error: ' + err.message));
    });
    req.setTimeout(timeout, function () {
        context.done(new Error(' Request timeout after ' + timeout + ' milliseconds.'));
    });
    req.end();
}

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

exports.handler = function(event, context) {
    if (Object.keys(event).length === 0){
        context.done();
    }
    if (event.lambdaOperation && event.apiKey) {
        switch(event.lambdaOperation) {
            case "Alerts":
                delete event.lambdaOperation;
                callOpsgenieApi(getReqOpts(alertsOPT, event), context);
                break;
            case "Users":
                delete event.lambdaOperation;
                callOpsgenieApi(getReqOpts(usersOPT, event), context);
                break;
            case "Counts":
                delete event.lambdaOperation;
                callOpsgenieApi(getReqOpts(countsOPT, event), context);
                break;
        }
    } else if (event.action){
        pubnub = require("pubnub")({
            publish_key   : publishKey,
            subscribe_key: subscribeKey
        });

        publishEventOnPubnub(event, context);
    } else {
        context.done(new Error("Function parameters are wrong"));
    }
};