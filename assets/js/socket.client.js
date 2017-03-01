import io from 'socket.io-client';
import $ from 'jquery';

let socket = io();
let newUser = false;
let newUserFollow = false;
let questions = false;

socket.on('connect', () => {
    newUser = false;
    newUserFollow = false;
    questions = false;
})
$('form').submit(function() {

    var msg = {};
    msg.content = $('#m').val();
    if (questions) {
        socket.emit('message:question:follow', msg);
        $('#messages').append($('<li>').text(msg.content));
        $('#m').val('');
        return false;
    }
    if (newUserFollow) {
        socket.emit('message:newUser:Yes:follow', msg);
    } else if (!newUser) {
        socket.emit('message', msg);
    } else {
        
        socket.emit("message:newUser", msg);

    }
    $('#messages').append($('<li>').text(msg.content));
    $('#m').val('');
    return false;
});

socket.on('message', function(msg) {
    $('#messages').append($('<li>').text(msg.content));
});

socket.on('message:newUser', function(msg) {
    newUser = true;
    $('#messages').append($('<li>').text(msg.content));

});

socket.on("message:newUser:follow", (msg) => {
    let scr = msg.sentiment;
    if (scr < 0) {
        newUser = false;
        newUserFollow = false;
        questions = false;
        socket.disconnect();
        socket.connect();
    } else if (scr > 0) {
        newUser = false;
        socket.emit('message:newUser:Yes');
    }
    $('#messages').append($('<li>').text(msg.content));
});

socket.on('message:newUser:Yes:follow', function(msg) {
    newUserFollow = true;
    console.log(msg);
    $('#messages').append($('<li>').text(msg.content));
});

socket.on('message:question', function(msg) {
    $('#messages').append($('<li>').text(msg.content));
    questions = true;
    socket.emit('message:question');
});

socket.on('message:question:follow', function(msg) {
    $('#messages').append($('<li>').text(msg.content));

});
