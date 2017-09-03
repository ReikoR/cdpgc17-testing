const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

const steam = require('./steam-controller');
const controller = new steam.SteamController();

const mbedPort = 8042;
const mbedAddress = '192.168.4.1';

var pipeMotorSpeed = 0;

var currentTime = Date.now();
var prevTime = currentTime;

controller.connect();

controller.on('data', (data) => {
    //console.log(data.joystick.y);

    pipeMotorSpeed = data.joystick.y / 10;
});

socket.on('error', (err) => {
    console.log(`socket error:\n${err.stack}`);
    socket.close();
});

socket.on('message', (msg, rinfo) => {
    //console.log(`socket got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    //console.log(msg);
    currentTime = Date.now();
    console.log(('0' + (currentTime - prevTime)).slice(-2), msg.readInt32LE(0), msg.readInt16LE(4));
    //console.log(msg.readInt32LE(6))
    //console.log(msg.readInt16LE(10))
    prevTime = currentTime;
});

socket.on('listening', () => {
    const address = socket.address();
    console.log(`socket listening ${address.address}:${address.port}`);

    let boomMotorSpeed = 0;

    var value = 0;

    setInterval(function () {
        const command = new Int16Array(2);

        command[0] = pipeMotorSpeed;
        command[1] = boomMotorSpeed;

        var message = new Buffer.from(command.buffer);
        socket.send(message, 0, message.length, mbedPort, mbedAddress);

        //pipeMotorSpeed = Math.sin(value) * 5000;
        //value += 0.002;
    }, 10);
});

socket.bind(8042);