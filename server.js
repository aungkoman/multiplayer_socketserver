var server_port = process.env.PORT || 5508; //reset to 5508 it is server port, 5508 is client port :D
var express = require('express'); 
var app = express();
var bodyParser = require('body-parser');
app.use(express.static('public'));
var cors = require('cors');
app.use(cors());
var server = app.listen(server_port, function () {
    var host = server.address().address;  
    var port = server.address().port;
     console.log('\x1b[36m%s\x1b[0m','Phaser Server is listening at http://'+host+''+port);
});

var gameState = "waiting"; // may be waiting, playing
var players = []; // 
var player = {
    username : null,
    userid : null,
    score : null,
    status : null,
}; // the user blue print


global.io= require('socket.io')(server);
io.on('connection', function(socket){
    console.log('\x1b[33m%s\x1b[0m','a user connected and it id is '+socket.id);
    socket.on('disconnect', function(){
        console.log('\x1b[32m%s\x1b[0m','a user disconnected');
        for(let i=0; i< players.length; i++){
            if(players[i].socket_id == socket.id){
                players.splice(i,1);
                i=players.length; // terminate loop;
                let data = {};
                data.socket_id = socket.id;
                socket.broadcast.emit('player_leave', data);
            }
        }
    });
    socket.on('data',(data)=>{
        console.log("data is arrived "+JSON.stringify(data));
        // send back to all client including sending socket
        let messageForAll = {
            "message":"for all"
        }
        io.emit('data',messageForAll);

        // send back data to only sending socket
        let messageForYou = {
            "message":"for you"
        }
        socket.emit('data',messageForYou);

        // sending to all clients except sender
        let messageForAllExceptSender = {
            "message":"for all except sender"
        }
        socket.broadcast.emit('data', messageForAllExceptSender);
    });
    

    socket.on('new_player',(data)=>{
        // first send back players to socket
        console.log("new_player");
        data.socket_id = socket.id;
        data.status="waiting";
        console.log(data);
        socket.emit('players', players);
        players[players.length] = data;
        socket.broadcast.emit('new_player', data);
        // add new player to players
        // send new player to other socket 
        // so all players sync
    });
    socket.on('ready_player',(data)=>{
        // find player in players array 
        // set player status into ready
        // check if all players are ready to play
        // if ready , emit game_state 
        // else emit ready_count (3/5 ) or ready list 
        let user_data;
        for(let i=0; i < players.length; i++){
            if(players[i].socket_id == socket.id){
                players[i].status = data.status;
                user_data = players[i];
            } 
        }
        let allAreReady = "yes";
        for(let i=0; i < players.length; i++){
            if(players[i].status != "ready") allAreReady = "no";
        }
        socket.broadcast.emit('ready_player', user_data);
        if(allAreReady == "yes"){
            gameState = "playing";
            io.emit('game_state', gameState);
        }
        
    });
    socket.on('player_action',(data)=>{
        data.socket_id = socket.id;
        console.log("player_action : socket server ");
        console.log(data);
        socket.broadcast.emit('player_action', data);
    });
    socket.on('star_iterate',(data)=>{
        data.socket_id = socket.id;
        console.log("star_iterate : socket server ");
        console.log(data);
        io.emit('star_iterate', data);
    });

 
 });

 /*
 Socket IO Cheetsheet
 // sending to sender-client only
socket.emit('message', "this is a test");

// sending to all clients, include sender
io.emit('message', "this is a test");

// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");

// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');

// sending to all clients in 'game' room(channel), include sender
io.in('game').emit('message', 'cool game');

// sending to sender client, only if they are in 'game' room(channel)
socket.to('game').emit('message', 'enjoy the game');

// sending to all clients in namespace 'myNamespace', include sender
io.of('myNamespace').emit('message', 'gg');

// sending to individual socketid
socket.broadcast.to(socketid).emit('message', 'for your eyes only');

// list socketid
for (var socketid in io.sockets.sockets) {}
 OR
Object.keys(io.sockets.sockets).forEach((socketid) => {});


Ref : https://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender
*/