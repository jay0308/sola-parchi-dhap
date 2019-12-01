import React from 'react';
import './App.css';
import axios from 'axios';
import App from './App';

const ajaxCall = (args) => {
  let url = "http://192.168.43.123:4000" + args.url
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

class LoginComponent extends React.Component {
  constructor(props){
    super(props);
    this.state = {      
      isUserLoggedin: localStorage.getItem('userDetail') ? true : false,
    }
  }
  

  

  addUser = () => {
    if (this.refs.email.value) {
      let reqObj = {
        method: "post",
        url: "/adduser",
        data: {
          email: this.refs.email.value
        }
      }
      ajaxCall(reqObj).then((res) => {
        localStorage.setItem("userDetail", JSON.stringify(res.data))
        this.setState({
          isUserLoggedin: true
        })
      }).catch((err) => {
        alert(err.toString())
      })
    } else {
      alert("PLease enter email")
    }
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

  

  render() {
    return (
      <div className="App">
        {
          this.state.isUserLoggedin ?
            <App/>
            :
            this.renderLoginScreen()
        }
      </div>
    )
  }
}

export default LoginComponent;
