import React, { Component } from "react";
import YoutubePlayer from "./YoutubePlayer";
import spinner from "../img/spinner.gif";

var socket = null;

export default class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: this.props.url
    };

    socket = this.props.socket;
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      url: nextProps.url,
      socket: nextProps.socket
    });
  }
  render() {
    return (
      <span>
        {this.state.url === "" ? (
          <span>
            <div>
              <h1 className="connecting">Connecting to server...</h1>
              <img
                src={spinner}
                style={{ width: "200px", margin: "auto", display: "block" }}
                alt="Loading..."
              />
            </div>
          </span>
        ) : (
          <span>
            <YoutubePlayer socket={socket} url={this.state.url} />
          </span>
        )}
      </span>
    );
  }
}
