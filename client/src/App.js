import React, { Component } from "react";
import Navbar from "./components/Navbar";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import io from "socket.io-client";
import Dashboard from "./components/Dashboard";

var socket;
class App extends Component {
  constructor() {
    super();
    this.state = {
      defaultURL: "2g811Eo7K8U",
      url: "",
      numPlayers: 0
    };

    socket = io();
  }

  componentDidMount() {
    //Emit sync to group to sync to other possible users
    socket.emit("numPlayersEvent", "");
    this.interval = setInterval(() => {
      if (this.state.url === "") {
        socket.emit("numPlayersEvent", "");
      }
    }, 5000);

    //Receive from socket
    socket.on("numPlayersEvent", msg => {
      if (this.state.numPlayers === 0) {
        //If you are the first user to connect use the default url
        if (msg === 1) {
          this.setState({
            url: this.state.defaultURL
          });
        } else {
          //IF there are other players request to sync with their video
          socket.emit("syncToGroupEvent", "");
        }
      }
    });

    socket.on("statusEvent", msg => {
      if (this.state.url === "") {
        this.setState({
          url: msg.video
        });
      }
    });
  }
  render() {
    return (
      <Router>
        <div className="App">
          <Navbar />
          <Dashboard socket={socket} url={this.state.url} />
        </div>
      </Router>
    );
  }
}

export default App;
