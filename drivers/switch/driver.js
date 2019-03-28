'use strict';

const Homey = require('homey');
const MQTTClient = require('../../mqtt/MQTTClient');

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

class MQTTSwitchDriver extends Homey.Driver {
	
	onInit() {
        this.log('MQTT Switch Driver is initialized');
    }

    async onPair(socket) {
        let client = new MQTTClient();

        let pairingDevice = {
            name: Homey.__('pair.default.name.switch'),
            settings: {},
            data: {
                id: guid(),
                version: 1
            },
            capabilities: [
                'onoff'     // TODO: Add from config
            ]
        };

        socket.on('log', function (msg, callback) {
            console.log(msg);
            callback(null, "ok");
        });

        socket.on('set', function (data, callback) {
            console.log('set: ' + JSON.stringify(data, null, 2));
            for (let key in data) {
                if (pairingDevice.hasOwnProperty(key)) {
                    pairingDevice[key] = data[key];
                } else {
                    pairingDevice.settings[key] = data[key];
                }
            }
            console.log('pairingDevice: ' + JSON.stringify(pairingDevice));
            callback(null, pairingDevice);
        });

        socket.on('getPairingDevice', function (data, callback) {
            callback(null, pairingDevice);
        });

        socket.on('install', function (data, callback) {

            client.isInstalled()
                .then(installed => {
                    if (!installed) {
                        calback("MQTT Client app not installed");
                        return;
                    }

                    Homey.addDevice(pairingDevice, (err, res) => {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, pairingDevice);
                        Homey.done();
                    });
                })
                .catch(error => callback(error));
        });

        socket.on('disconnect', function () {
            console.log("User aborted or pairing is finished");
        });
    }
}

module.exports = MQTTSwitchDriver;