import React, { Component } from "react";

var socket = null;

export default class YoutubeControls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: this.props.progress,
      duration: this.props.duration
    };

    socket = this.props.socket;

    this.calculateProgress = this.calculateProgress.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ time: nextProps.time, duration: nextProps.duration });
  }

  barClicked(evt) {
    const bar = document.getElementsByClassName("wrapper");
    var fullWidth = bar[0].offsetWidth;

    var e = evt.target;
    var dim = e.getBoundingClientRect();
    var x = evt.clientX - dim.left;

    var time = (x / fullWidth) * this.state.duration;
    socket.emit("seekEvent", time);
  }

  playClicked() {
    socket.emit("playEvent", this.state.time);
  }

  pauseClicked() {
    socket.emit("pauseEvent", this.state.time);
  }

  calculateProgress() {
    if (this.state.time) {
      var time = this.state.time;
      var duration = this.state.duration;
      var percentage = (time / duration) * 100.0;
      return percentage;
    } else {
      return 0;
    }
  }

  render() {
    return (
      <div className="youtube-controls">
        <div className="flex-container">
          <div>
            <button
              className="btn btn-info mr-0 mt-0 ml-0"
              onClick={this.playClicked.bind(this)}
            >
              Play
            </button>
            <button
              className="btn btn-info mr-0 mt-0 ml-0"
              onClick={this.pauseClicked.bind(this)}
            >
              Pause
            </button>
          </div>
          <div className="remaining">
            <div className="wrapper">
              <div className="navi" onClick={this.barClicked.bind(this)}>
                <div
                  className="filler"
                  style={{ width: this.calculateProgress() + "%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
