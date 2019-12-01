import React from 'react';
import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client';
import axios from 'axios';
import PlayGround from './PlayGround';

// let socket = io('http://localhost:4000');

const ajaxCall = (args) => {
  let url = "https://sola-parchi-dhap.herokuapp.com:4000" + args.url
  if (args.method.toLowerCase() === 'get') {
    return axios({
      method: args.method,
      url: url
    })
  } else if (args.method.toLowerCase() === 'post') {
    return axios({
      method: args.method,
      url: url,
      data: args.data
    })
  }
}

// const initSocket = () => {
//   socket.on('connect', function(){
//     console.log("client connected")
//   });

// }

// const sendMessage = () => {
//   socket.emit('newMessage', { 
//     from:'jen@mds', 
//     text:'hepppp', 
//     createdAt:123 
//   });
// }

// socket.on('serverMsg',function(data){
//   console.log(data)
// })
// socket.on('disconnect', function(){});



class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isUserLoggedin: localStorage.getItem('userDetail') ? true : false,
      onlineUsers: null,
      chatText:[],
      activeTab:0,
      showConfrmModal:false,
      requestData:null,
      isStartGame:false,
      playersInGame:null,
      gameTurn:null
    }
    this.socket = io('https://sola-parchi-dhap.herokuapp.com:4000?email=' + (JSON.parse(localStorage.getItem('userDetail')).email.replace('@', '*')))
  }


  componentDidMount() {
    this.socket.on('connect', () => {
      console.log("You are connected");
    });

    this.socket.on('connectedUser', (data) => {
      console.log(data)
      this.setOnlineUsers(data)
    })

    this.socket.on('serverMsg', (data) => {
      let arr = this.state.chatText;
      arr.push(data)
      this.setState({
        chatText:arr
      })
      console.log(data)
    })

    this.socket.on('playingRequest_'+JSON.parse(localStorage.getItem('userDetail')).email,(data)=>{
      console.log('playing req',data)
      this.setState({
        requestData:data
      })
      this.openCnfrmModal()
      // alert(data.from)
    })

    this.socket.on('acceptRequest_'+JSON.parse(localStorage.getItem('userDetail')).email,(data)=>{
      console.log('acceptRequest_',data)
      if(!data.error)
        alert("accepted by "+data.acceptId)
      else
        alert(data.error)
      // alert(data.from)
    })

    this.socket.on('rejectRequest_'+JSON.parse(localStorage.getItem('userDetail')).email,(data)=>{
      console.log('rejectRequest_',data)
      alert("rejected by "+data.rejectId)
      // alert(data.from)
    })

    this.socket.on('startGame_'+JSON.parse(localStorage.getItem('userDetail')).email,(data)=>{
      console.log('startGame_',data)
      this.setState({
        isStartGame:true,
        playersInGame:data
      })
      // alert(data.from)
    })

    this.socket.on('gameTurn',(data)=>{
      console.log('GameTurn',data)
      this.setState({
        gameTurn:data,
        playersInGame:data.players
      })
    })

    this.socket.on('playerWin',(data)=>{
      alert(data + " win")
    })
  }

  componentWillUnmount() {
    this.socket.close()
  }

  setOnlineUsers = (userList) => {
    let userEmail = JSON.parse(localStorage.getItem('userDetail')).email;
    let onlineUsers = [];
    userList.map((ele) => {
      if (userEmail !== ele.email) {
        onlineUsers.push(ele.email)
      }
    })
    this.setState({
      onlineUsers: onlineUsers
    })
  }

  sendMsg = () => {
    if(this.refs.chatTxtBox.value)
      this.socket.emit('newMessage', JSON.parse(localStorage.getItem('userDetail')).email + " says : "+ this.refs.chatTxtBox.value);

      this.refs.chatTxtBox.value = ""
  }

  setTab = (tabNo) => {
    this.setState({
      activeTab:tabNo
    })
  }

  openCnfrmModal = () => {
    this.setState({
      showConfrmModal:true
    })
  }

  closeCnfrmModal = () => {
    this.setState({
      showConfrmModal:false
    })
  }

  acceptRequest = () => {
    let userEmail = JSON.parse(localStorage.getItem('userDetail')).email
    let data = {
      acceptId:userEmail,
      requestId:this.state.requestData.from
    }
    this.socket.emit('acceptRequest',data)
    this.closeCnfrmModal()
  }

  rejectRequest = () => {
    let userEmail = JSON.parse(localStorage.getItem('userDetail')).email
    let data = {
      rejectId:userEmail,
      requestId:this.state.requestData.from
    }
    this.socket.emit('rejectRequest',data)
    this.closeCnfrmModal()
  }

  renderLoginScreen = () => {
    return (
      <div className="loginScreen">
        <div className="loginScreenInner">
          <input type="text" placeholder="Your Email" ref="email" />
          <button className="getInBtn" onClick={this.addUser}>Get In</button>
        </div>
      </div>
    )
  }

  renderAfterLogin = () => {
    let userEmail = JSON.parse(localStorage.getItem('userDetail')).email
    return (
      <div className="welcome-user">
        <h2>welcome {userEmail}</h2>
      </div>
    )
  }

  renderOnlineUsers = () => {
    return (
      <div className="onlineUsers">
        {/* <h2>Active users</h2> */}
        {
          this.state.onlineUsers.map((e) => {
            return (
              <div className="userList" key={e}>{e}</div>
            )
          })
        }
      </div>
    )
  }

  renderChatWindow = () => {
    return(
      <div className="chatWindow">
        <div className="chatBox">
          {
            this.state.chatText.map((e,i)=>{
            return <div key={i}>{e}</div>
            })
          }
        </div>
        <div className="chatAction">
          <input type="text" ref="chatTxtBox"/>
          <button onClick={this.sendMsg}>send</button>
        </div>
      </div>
    )
  }

  renderTabs = () => {
    return(
      <div className="tabCont">
        <span className={"tab "+(this.state.activeTab === 0 ? "active" : "")} onClick={()=>{this.setTab(0)}}>Chat</span>
        <span className={"tab "+(this.state.activeTab === 1 ? "active" : "")} onClick={()=>{this.setTab(1)}}>Active</span>
        <span className={"tab "+(this.state.activeTab === 2 ? "active" : "")} onClick={()=>{this.setTab(2)}}>Playground</span>
      </div>
    )
  }

  renderCnfrmModal = () => {
    return(
      <div className="cnfrmModal">
        <div className="cnfrmModalInner">
          <div className="modal-body">
            <b>{this.state.requestData.from}</b> <br/> has requested to play
          </div>
          <div className="modal-footer">
            <button className="accept-btn" onClick={this.acceptRequest}>Accept</button>
            <button className="ignore-btn" onClick={this.rejectRequest}>Ignore</button>
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="App">
        {
          this.state.isUserLoggedin ?
            this.renderAfterLogin()
            :
            this.renderLoginScreen()
        }
        {
          this.renderTabs()
        }
        {
          this.state.activeTab === 0 &&
          this.renderChatWindow()
        }
        {
          this.state.activeTab === 1 &&
          this.renderOnlineUsers()
        }
        {
          this.state.activeTab === 2 &&
          <PlayGround
            socket = {this.socket}
            activeUsers = {this.state.onlineUsers}
            startGame = {this.state.isStartGame}
            playersInGame = {this.state.playersInGame}
            gameTurn = {this.state.gameTurn}
          />
        }
        {
          this.state.showConfrmModal &&
          this.renderCnfrmModal()
        }
      </div>
    )
  }
}

export default App;
