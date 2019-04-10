import React, { Component } from "react";
import YouTube from "react-youtube";

var player = null;
var serverPlay = false;
var hasSynced = false;
var socket = null;

function serverPlayVideo(time) {
  serverPlay = true;
  hasSynced = true;

  if (player != null) {
    player.seekTo(time);
    player.playVideo();
  }
}

function serverPauseVideo() {
  serverPlay = false;

  if (player != null) {
    player.pauseVideo();
  }
}

function resetVideo() {
  serverPlay = false;

  if (player != null) {
    player.seekTo(0.0);
  }
}

function serverPlaybackRate(rate) {
  if (player != null) {
    player.setPlaybackRate(rate);
  }
}

function syncToServer(time, isPlaying, rate) {
  if (player != null) {
    serverPlaybackRate(rate);

    if (isPlaying) {
      serverPlayVideo(time);
    } else {
      player.seekTo(time);
      serverPauseVideo();
    }
  }
}

export default class YoutubePlayer extends Component {
  constructor(props) {
    super(props);
    socket = this.props.socket;

    this._onPlay = this._onPlay.bind(this);
    this._onPause = this._onPause.bind(this);
    this._onReady = this._onReady.bind(this);
    this._onEnd = this._onEnd.bind(this);
    this._onPlaybackRateChange = this._onPlaybackRateChange.bind(this);

    socket.on("event", function(msg) {
      if (msg === "play") {
        serverPlayVideo(0.0);
      } else if (msg === "pause") {
        serverPauseVideo();
      }
    });

    socket.on("playEvent", function(msg) {
      serverPlayVideo(msg);
    });

    socket.on("playbackEvent", function(msg) {
      serverPlaybackRate(msg);
    });

    socket.on("syncToGroupEvent", function(msg) {
      if (hasSynced && player != null) {
        socket.emit("statusEvent", {
          time: player.getCurrentTime(),
          isPlaying: serverPlay,
          rate: player.getPlaybackRate()
        });
      }
    });
    socket.on("statusEvent", function(msg) {
      syncToServer(msg.time, msg.isPlaying, msg.rate);
    });
  }

  render() {
    const opts = {
      height: "390pt",
      width: "100%",
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        rel: 0,
        fs: 0,
        controls: 1
      }
    };
    return (
      <div className="youtube-player">
        <div className="container">
          <div className="row">
            <div className="col-md-8 m-auto">
              <h1 className="display-4 text-center">Youtube Sync</h1>
              <div className="video">
                <YouTube
                  videoId="2g811Eo7K8U"
                  opts={opts}
                  onReady={this._onReady}
                  onPlay={this._onPlay}
                  onPause={this._onPause}
                  onEnd={this._onEnd}
                  onStateChange={this._onStateChange}
                  onPlaybackRateChange={this._onPlaybackRateChange}
                />
              </div>

              <button
                onClick={this.onTestServerPlay.bind(this)}
                className="btn btn-info mr-2"
              >
                Test Server Play
              </button>
              <button
                onClick={this.onTestServerPause.bind(this)}
                className="btn btn-info mr-2"
              >
                Test Server Pause
              </button>
              <button
                onClick={this.syncClicked.bind(this)}
                className="btn btn-info mr-2"
              >
                Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  _onReady(event) {
    // access to player in all event handlers via event.target
    player = event.target;
    //player.pauseVideo();
    serverPauseVideo();

    //Emit sync to group to sync to other possible users
    socket.emit("syncToGroupEvent", "");
  }

  _onPlay(event) {
    console.log(serverPlay);
    if (!serverPlay) {
      player.pauseVideo();
      //Send message to server to play
      socket.emit("playEvent", player.getCurrentTime());
    }
  }

  _onPause(event) {
    console.log(serverPlay);
    if (serverPlay) {
      player.playVideo();
      //Send message to server to pause
      socket.emit("event", "pause");
    }
  }

  _onEnd(event) {
    //Reset the video
    socket.emit("event", "pause");
    resetVideo();
  }

  _onPlaybackRateChange(event) {
    socket.emit("playbackEvent", player.getPlaybackRate());
  }

  syncClicked() {
    socket.emit("playEvent", player.getCurrentTime());
  }

  onTestServerPlay(e) {
    player.getCurrentTime();
  }

  onTestServerPause(e) {
    serverPauseVideo();
  }
}
