const express = require('express')
const socketIO = require('socket.io');
const app = express()
const port = 4000
const bodyParser = require('body-parser');
const url = require('url');

const http = require('http')
let server = http.createServer(app)
let io = socketIO(server)

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://192.168.43.123:3000"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true)
    next()
})


let rooms = new Map();
let teams = {};


const getRandomInt = (max) => {
    var x = Math.floor((Math.random() * max) + 0);
    return x;
}

const shufflingCards = () => {
    let cards = ['Steve Jobs', 'Steve Jobs', 'Steve Jobs', 'Steve Jobs',
        'Bill Gates', 'Bill Gates', 'Bill Gates', 'Bill Gates',
        'Mark Zekerberg', 'Mark Zekerberg', 'Mark Zekerberg', 'Mark Zekerberg',
        'Jeff Bezos', 'Jeff Bezos', 'Jeff Bezos', 'Jeff Bezos'
    ]
    return () => {
        let arr = [];
        for (let i = 0; i < 4; i++) {
            let randomNo = getRandomInt(cards.length);
            arr.push(cards[randomNo]);
            cards.splice(randomNo, 1);
        }
        return arr;
    }
}
const getUserList = (map) => {
    let list = [];
    // iterate over values (amounts)
    for (let val of map.values()) {
        list.push(val); // 500, 350, 50
    }
    return list;

}

const getSocketOfReq = (usrId) => {
    for (let entry of rooms.keys()) {
        if (rooms.get(entry) && rooms.get(entry).email === usrId)
            return entry;
    }
}

const sendRequestToStartGame = (io, teamiId) => {
    console.log("Inside sendReqTostartGane",teams[teamiId])
    let arr = teams[teamiId].players.map(e => { return e });
    if (teams[teamiId].players.length < 4)
        return;

    let cardsShuffler = shufflingCards();
    for (let i = 0; i < arr.length; i++) {
        let cards = cardsShuffler();
        arr[i].cards = cards;
        io.sockets.emit('startGame_' + arr[i].email, arr)
    }
    teams[teamiId].next = arr[1].email;
    teams[teamiId].turn = arr[0].email
    io.sockets.emit('gameTurn',teams[teamiId]);
}

const sendTeamsOnConnect = () => {
    console.log("TEAMS",teams)
    for (let key in teams) {
        sendRequestToStartGame(io, key)
    }
}

const getTeamFromUserId = (userId) => {
    let containsPlayer = [];
    for (let key in teams) {
        containsPlayer = teams[key].players.filter((e)=>{
            if(e.email === userId)
                return e
        })
        if(containsPlayer.length > 0)
            return key
    }

    return false;
}

const checkWin = (arr) => {
    let count = 0;
    if(arr.length === 4){
        for(let i = 0;i<arr.length;i++){
            if(arr[0] === arr[i])
                count++;
        }
        if(count === 4)
            return true
    }

    return false;
}

const getNextPlayer = (teamiId,playerId) => {
    for(let i=0;i<teams[teamiId].players.length;i++){
        if(teams[teamiId].players[i].email === playerId){
            if(i === teams[teamiId].players.length-1){
                return teams[teamiId].players[0].email
            }else{
                return teams[teamiId].players[i+1].email
            }
        }
    }
}

const checkUserMove = (data) => {
    let team = getTeamFromUserId(data.email);
    
    if(team){
        for(let i = 0;i<teams[team].players.length;i++){
            let player = teams[team].players[i];
            if(player.email === data.email){
                if(data.cardTxt){
                    if(i === teams[team].players.length -1){
                        teams[team].players[0].cards.push(data.cardTxt);
                        console.log("GGG",teams[team].players[0].cards)
                    }else{
                        teams[team].players[i+1].cards.push(data.cardTxt)
                        console.log("HHH",teams[team].players[i+1].cards)
                    }
                    teams[team].players[i].cards.splice(data.cardIndex,1) 
                               
                }
                teams[team].turn = teams[team].next
                teams[team].next = getNextPlayer(team,teams[team].turn)
                
                if(checkWin(player.cards)){
                    io.sockets.emit('playerWin',player.email)
                }else{
                    // sendTeamsOnConnect();
                    io.sockets.emit('gameTurn',teams[team]);
                }
                break;
            }
        }
        
        
    }
}


io.on('connection', (socket) => {
    console.log('New user connected', socket.request.url);
    var queryData = url.parse(socket.request.url, true).query;
    if (!rooms.has(socket)) {
        rooms.set(socket, {
            email: queryData.email.replace('*', '@')
        });
    }
    console.log("Rooms", rooms.size)
    io.sockets.emit('connectedUser', getUserList(rooms));

    sendTeamsOnConnect();

    socket.on('newMessage', (data) => {
        io.sockets.emit('serverMsg', data);
    })

    socket.on('playerRequest', (data) => {
        console.log('player req', data)
        io.sockets.emit('playingRequest_' + data.to, data);
    })

    socket.on('acceptRequest', (data) => {
        console.log("acceptRequest", data)
        if (teams.hasOwnProperty(data.requestId)) {
            if (teams[data.requestId].players.length < 4) {
                if (teams[data.requestId].players.indexOf(data.acceptId) > -1) {
                    data.error = data.acceptId + " already added";
                    console.log('4. acceptRequest_' + data.requestId, data)
                    io.sockets.emit('acceptRequest_' + data.requestId, data);
                } else {
                    teams[data.requestId].players.push({ email: data.acceptId })
                    data.error = false;
                    console.log('1. acceptRequest_' + data.requestId, data)
                    io.sockets.emit('acceptRequest_' + data.requestId, data);
                }
                if (teams[data.requestId].players.length === 4) {
                    sendRequestToStartGame(io, data.requestId)
                }
            } else {
                data.error = "Team is full";
                console.log('2. acceptRequest_' + data.requestId, data)
                io.sockets.emit('acceptRequest_' + data.requestId, data);
            }
        } else {
            teams[data.requestId] = {
                players:[]
            } ;
            teams[data.requestId].players.push({ email: data.requestId })
            teams[data.requestId].players.push({ email: data.acceptId })
            data.error = false;
            console.log('3. acceptRequest_' + data.requestId, data)
            io.sockets.emit('acceptRequest_' + data.requestId, data);
        }
    })

    socket.on('rejectRequest', (data) => {
        console.log("rejectRequest", data)
        io.sockets.emit('rejectRequest_' + data.requestId, data);
    })


    socket.on('userMove',(data) => {
        checkUserMove(data)
    })


    // when server disconnects from user 
    socket.on('disconnect', () => {
        console.log('disconnected from user');
        rooms.delete(socket);
        io.sockets.emit('connectedUser', getUserList(rooms));
        console.log("Rooms", rooms.size)
    });

});

app.get('/', (req, res) => res.send('Hello World!'));


app.post('/adduser', (req, res) => {
    if (req.body.email in rooms) {
        res.send({ email: req.body.email })
    } else {
        res.send({ email: req.body.email });
    }
});

server.listen(port, () => console.log(`Example app listening on port ${port}!`))
