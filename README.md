# OpsGenie Real-Time Alert View
Demo of a Real-Time Alert Dashboard by tracking OpsGenie Alert API &amp; WebHook

## Installing npm

a package manager for JavaScript http://www.npmjs.com

npm is bundled with Node.js http://nodejs.org/download

## Installing Bower

a package manager for the Web http://bower.io

```sh
$ npm install -g bower
```

## Installing project dependencies

```sh
# install dependencies listed in bower.json
$ cd web
$ bower install
```

```sh
# install dependencies listed in package.json
$ cd lambda
$ npm install
```

## Configuring project

All required configuration options are listed under

```sh
/web/resources/js/configure.js
```

```sh
/lambda/index.js
```

## Running project

Lambda Function contains pure Node.js code and requires PubNub javascript library.

## Configuring Project
* Create PubNub account, and create application on the PubNub Dashboard.
* Change "publishKey = "<PUBNUB_PUBLISH_KEY"" parameter in the "/lambda/index.js" with your newly created application publish_key.
* Change "subscribeKey = "<PUBNUB_SUBSCRIBE_KEY>"" parameter in the "/lambda/index.js" with your newly created application subscribe_key.
* Change "SubscribeKey: "pubnub-subscribe-key"" parameter in the "/web/resources/js/configure.js" with your newly created application subscribe_key.
* Change "Channel: "pubnub-channel"" parameter in the "/web/resources/js/configure.js" with a channel name you want.
* Change "channelId = "<PUBNUB_CHANNEL>"" parameter in the "/lambda/index.js" with the channel name you typed earlier.
* Change "key: "opsgenie-web-api-key"" parameter in the "/web/resources/js/configure.js" with the API Integration key you have on your OpsGenie Application.

## Deploying Lambda Function
* Select index.js and node_modules folder and compress as .ZIP file.
* Create Funtion on AWS Lambda Console
* Upload .ZIP file from Code Tab on Lambda Console.
* On the Api endpoints tab, add API endpoint with { API endpoint type: API Gateway, Method: OPTIONS, Security: Open } parameters and submit. 
	* Replace "url: "aws-gateway-url"" parameter in the /web/resources/js/configure.js file with Api endpoint URL.
	* To enable CORS, on the AWS Gateway Console, add Header Mappings on the Integrations Response tab.
		* Add Header: Access-Control-Allow-Headers 	=>	'Content-Type,X-Amz-Date,Authorization'
		* Add Header: Access-Control-Allow-Methods 	=>	'GET,POST,OPTIONS'
		* Add Header: Access-Control-Allow-Origin 	=>	'*'
* On the Api endpoints tab, add API endpoint with { API endpoint type: API Gateway, Method: POST, Security: Open } parameters and submit.
	* To receive notifications from OpsGenie, add OpsGenie Webhook Integration on OpsGenie integrations page and fill URL parameter with Api endpoint URL.


Web project contains pure HTML/JavaScript code. Deploy all **web** folder content to your favorite HTTP Server.

## Browser Compatibility

* Chrome 5+
* Internet Explorer 9+
* Firefox 29+
* Safari 5.1+
* Opera 10.5+
