const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

const steam = require('./steam-controller');
const controller = new steam.SteamController();

const mbedPort = 8042;
const mbedAddress = '192.168.4.1';

var pipeMotorSpeed = 0;
var xMotorSpeed = 0;

var currentTime = Date.now();
var prevTime = currentTime;

var speedLimit = 64000;
var defaultMaxSpeed = 4000;
var maxSpeed = defaultMaxSpeed;

var prevButtons = {};

controller.connect();

function clone(obj) {
	var cloned = {};
	
	for (key in obj) {
		cloned[key] = obj[key];
	}
	
	return cloned;
}

controller.on('data', (data) => {
    //console.log(data.button);
	
	if (!prevButtons.A && data.button.A) {
		console.log('A');
		maxSpeed = defaultMaxSpeed;
		console.log(maxSpeed);
	}
	
	if (!prevButtons.X && data.button.X) {
		console.log('X');
		maxSpeed /= 2;
		console.log(maxSpeed);
	}
	
	if (!prevButtons.Y && data.button.Y) {
		console.log('Y');
		maxSpeed *= 2;
		
		if (maxSpeed > speedLimit) {
			maxSpeed = speedLimit;
		}
		
		console.log(maxSpeed);
	}
	
	prevButtons = clone(data.button);

    pipeMotorSpeed = data.joystick.y / 32768 * maxSpeed;
    xMotorSpeed = data.joystick.x / 32768 * maxSpeed;

	//console.log(data.joystick);
});

socket.on('error', (err) => {
    console.log(`socket error:\n${err.stack}`);
    socket.close();
});

socket.on('message', (msg, rinfo) => {
    //console.log(`socket got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    //console.log(msg);
    currentTime = Date.now();
    console.log(('0' + (currentTime - prevTime)).slice(-2),
		msg.readInt32LE(0), msg.readInt32LE(4), msg.readInt32LE(8), msg.readInt32LE(12));
    //console.log(msg.readInt32LE(6))
    //console.log(msg.readInt16LE(10))
    prevTime = currentTime;
});

socket.on('listening', () => {
    const address = socket.address();
    console.log(`socket listening ${address.address}:${address.port}`);

    var value = 0;

    setInterval(function () {
        const command = new Int32Array(2);

        command[0] = pipeMotorSpeed;
        command[1] = xMotorSpeed;

        var message = new Buffer.from(command.buffer);
        socket.send(message, 0, message.length, mbedPort, mbedAddress);

        //pipeMotorSpeed = Math.sin(value) * 1000;
        //value += 0.005;
    }, 15);
});

socket.bind(8042);