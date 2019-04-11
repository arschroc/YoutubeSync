import React, { Component } from "react";
import YouTube from "react-youtube";
import TextFieldGroup from "./TextFieldGroup";

var player = null;
var serverPlay = false;
var serverPause = false;
var hasSynced = false;
var socket = null;
var isPlaying = false;
var defaultUrl = "2g811Eo7K8U";

function playVideo(time) {
  hasSynced = true;

  if (player != null) {
    player.seekTo(time);
    player.playVideo();
  }
}

function sendPlayToServer() {
  player.pauseVideo();
  socket.emit("playEvent", player.getCurrentTime());
}

function sendPauseToServer() {
  player.playVideo();
  socket.emit("pauseEvent", "pause");
}

function pauseVideo() {
  if (player != null) {
    player.pauseVideo();
  }
}

function resetVideo() {
  serverPlay = false;
  serverPause = false;

  if (player != null) {
    player.seekTo(0.0);
  }
}

function setPlaybackRate(rate) {
  if (player != null) {
    player.setPlaybackRate(rate);
  }
}

function syncToServer(time, playing, rate) {
  if (player != null) {
    setPlaybackRate(rate);

    if (playing) {
      serverPlay = true;
      playVideo(time);
    } else {
      player.seekTo(time);
      serverPause = true;
      pauseVideo();
    }
  }
}

export default class YoutubePlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: "2g811Eo7K8U",
      inputURL: "",
      errors: {}
    };

    socket = this.props.socket;

    this._onPlay = this._onPlay.bind(this);
    this._onPause = this._onPause.bind(this);
    this._onReady = this._onReady.bind(this);
    this._onEnd = this._onEnd.bind(this);
    this._onPlaybackRateChange = this._onPlaybackRateChange.bind(this);
    this._onError = this._onError.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    socket.on("pauseEvent", function(msg) {
      serverPause = true;
      serverPlay = false;
      pauseVideo();
    });

    socket.on("playEvent", function(msg) {
      serverPlay = true;
      serverPause = false;
      playVideo(msg);
    });

    socket.on("playbackEvent", function(msg) {
      setPlaybackRate(msg);
    });

    socket.on("syncToGroupEvent", function(msg) {
      if (hasSynced && player != null) {
        socket.emit("statusEvent", {
          time: player.getCurrentTime(),
          isPlaying: isPlaying,
          rate: player.getPlaybackRate()
        });
      }
    });
    socket.on("statusEvent", function(msg) {
      syncToServer(msg.time, msg.isPlaying, msg.rate);
    });
    socket.on("newVideoEvent", msg => {
      this.setState({ url: msg });
    });
  }

  onSubmit(e) {
    e.preventDefault();
    var newURL = this.state.inputURL.split("=")[1];

    if (newURL === undefined) {
      var errors = {};
      errors.invalid = "Not a valid youtube url";

      this.setState({ errors: errors, inputURL: "" });
    } else {
      this.setState({ errors: {}, inputURL: "" });

      //emit new video
      socket.emit("newVideoEvent", newURL);
    }
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
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
        controls: 1,
        showinfo: 0,
        ecver: 2
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
                  videoId={this.state.url}
                  opts={opts}
                  onReady={this._onReady}
                  onPlay={this._onPlay}
                  onPause={this._onPause}
                  onEnd={this._onEnd}
                  onStateChange={this._onStateChange}
                  onPlaybackRateChange={this._onPlaybackRateChange}
                  onError={this._onError}
                />
              </div>
            </div>
          </div>

          <form onSubmit={this.onSubmit} className="mt-2">
            <div className="form-row">
              <div className="form-group col-md-8 m-auto">
                <h5 className="">
                  Enter new video url (e.g.
                  https://www.youtube.com/watch?v=2g811Eo7K8U)
                </h5>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group col-md-2" />
              <div className="form-group col-md-5">
                <TextFieldGroup
                  placeholder="Youtube url"
                  name="inputURL"
                  type="text"
                  value={this.state.inputURL}
                  onChange={this.onChange}
                  error={this.state.errors.invalid}
                />
              </div>
              <div className="form-group col-md-3">
                <input type="submit" className="btn btn-info" />
                <button
                  onClick={this.syncClicked.bind(this)}
                  className="btn btn-info mr-2 mt-0 ml-2"
                >
                  Sync
                </button>
              </div>
              <div className="form-group col-md-2" />
            </div>
          </form>
        </div>
      </div>
    );
  }

  _onReady(event) {
    // access to player in all event handlers via event.target
    player = event.target;
    player.pauseVideo();

    //Emit sync to group to sync to other possible users
    socket.emit("syncToGroupEvent", "");
  }

  _onPlay(event) {
    if (serverPlay) {
      serverPlay = false;
      isPlaying = true;
    } else if (serverPause) {
      player.pauseVideo();
    } else {
      serverPlay = true;
      sendPlayToServer();
    }
  }

  _onPause(event) {
    if (serverPause || serverPlay) {
      serverPause = false;
      isPlaying = false;
    } else {
      serverPause = true;
      sendPauseToServer();
    }
  }

  _onEnd(event) {
    //Reset the video
    socket.emit("pauseEvent", "pause");
    resetVideo();
  }

  _onPlaybackRateChange(event) {
    socket.emit("playbackEvent", player.getPlaybackRate());
  }

  _onError(event) {
    var errors = {};
    errors.invalid = "Not a valid youtube url";

    this.setState({ errors: errors });

    //TODO Emit new video of default
    socket.emit("newVideoEvent", defaultUrl);
  }

  syncClicked() {
    socket.emit("playEvent", player.getCurrentTime());
  }
}
