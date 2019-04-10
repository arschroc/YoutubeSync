import React, { Component } from "react";
import Navbar from "./components/Navbar";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import YoutubePlayer from "./components/YoutubePlayer";
import "./App.css";
import io from "socket.io-client";

var socket;
class App extends Component {
  constructor() {
    super();
    socket = io();
  }
  render() {
    return (
      <Router>
        <div className="App">
          <Navbar />
          <YoutubePlayer socket={socket} />
        </div>
      </Router>
    );
  }
}

export default App;
