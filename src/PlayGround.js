import React from 'react';

class PlayGround extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            selectCardTxt:"",
            selectCardInd:""
        }
    }

    sendRequestToPlayer = (playerId) => {
        const { socket } = this.props;
        socket.emit('playerRequest', {
            from: JSON.parse(localStorage.getItem('userDetail')).email,
            to: playerId
        })
    }

    selectCard = (txt,ind) => {
        this.setState({
            selectCardInd:ind,
            selectCardTxt:txt
        })
    }

    sendCard = () => {
        this.props.socket.emit('userMove',{
            email:JSON.parse(localStorage.getItem('userDetail')).email,
            cardTxt:this.state.selectCardTxt,
            cardIndex:this.state.selectCardInd
        })
    }

    renderActiveUserCard = (usr) => {
        return (
            <div className="activeUsrCard">
                <span className="usrName">
                    Let's play with <br /> <b>{usr}</b>
                </span>
                <button onClick={() => { this.sendRequestToPlayer(usr) }}>Send Request</button>
            </div>
        )
    }
    renderActiveUsers = () => {
        const { activeUsers } = this.props
        return (
            <div className="activeUsers">
                {
                    activeUsers &&
                    activeUsers.map(e => {
                        return this.renderActiveUserCard(e)
                    })
                }
            </div>
        )
    }
    renderGamePanel = () => {
        const { playersInGame,gameTurn } = this.props
        return (
            <div className="gamePanel">
                <div className="playersInGame">
                    <h2>Players in game</h2>
                    {
                        playersInGame &&
                        playersInGame.map((e,i) => {
                            return <span>
                                <span>{e.email}</span>
                                {gameTurn && <span className="next">{gameTurn.next === e.email ? "Next" : ""}</span>}
                                {gameTurn && <span className="turn">{gameTurn.turn === e.email? "Turn" : ""}</span>}
                            </span> 
                        })
                    }
                </div>
                <div className="cards">
                    <h2>Your Cards</h2>
                    {
                            playersInGame &&
                            playersInGame.map((e) => {
                                if(e.email === JSON.parse(localStorage.getItem('userDetail')).email){
                                    return e.cards.map((ele,index)=>{
                                        return (                                            
                                            <div className={"gameCard "+(this.state.selectCardInd === index ? "selected" : "")} onClick={()=>{this.selectCard(ele,index)}}>
                                                {ele}
                                            </div>
                                        )
                                    })
                                }
                            })
                        }
                </div>
                {
                    gameTurn &&
                    gameTurn.turn === JSON.parse(localStorage.getItem('userDetail')).email &&
                    <div className="sendCard">
                        <button className="send-card-btn" onClick={this.sendCard}>Send Card</button>
                    </div>
                }
            </div>
        )
    }
    render() {
        return (
            <div className="playground">
                {
                    !this.props.startGame ?
                        this.renderActiveUsers()
                        :
                        this.renderGamePanel()
                }
            </div>
        )
    }
}

export default PlayGround;