import React, { Component } from "react";
import YouTube from "react-youtube";
import TextFieldGroup from "./TextFieldGroup";
import YoutubeControls from "./YoutubeControls";

var player = null;
var hasSynced = false;
var socket = null;
var isPlaying = false;
var defaultUrl = "2g811Eo7K8U";

function playVideo(time) {
  if (player != null) {
    player.seekTo(time);
    player.playVideo();
  }
}

function pauseVideo(time) {
  if (player != null) {
    player.seekTo(time);
    player.pauseVideo();
  }
}

function seekToTime(time) {
  if (player != null) {
    player.seekTo(time);
  }
}

function resetVideo() {
  if (player != null) {
    player.seekTo(0.0);
  }
}

function setPlaybackRate(rate) {
  if (player != null) {
    player.setPlaybackRate(rate);
  }
}

export default class YoutubePlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: this.props.url,
      inputURL: "",
      time: 0.0,
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
    this.submitClicked = this.submitClicked.bind(this);
    this.syncToServer = this.syncToServer.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ url: nextProps.url });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      if (player) {
        this.setState({ time: player.getCurrentTime() });
      } else {
        this.setState({ time: 0.0 });
      }
    }, 100);

    socket.on("pauseEvent", msg => {
      pauseVideo(msg);
    });

    socket.on("playEvent", msg => {
      playVideo(msg);
    });

    socket.on("playbackEvent", msg => {
      setPlaybackRate(msg);
    });

    socket.on("syncToGroupEvent", msg => {
      var socketid = msg;
      if (socket.io.engine.id !== msg && player !== null) {
        socket.emit("statusEvent", {
          time: player.getCurrentTime(),
          isPlaying: isPlaying,
          video: this.state.url,
          socketID: socketid
        });
      }
    });
    socket.on("statusEvent", msg => {
      this.syncToServer(msg.time, msg.isPlaying, msg.video);
    });
    socket.on("newVideoEvent", msg => {
      this.setState({ url: msg });
    });
    socket.on("seekEvent", msg => {
      seekToTime(msg);
    });

    document.body.onkeyup = function(e) {
      if (e.keyCode === 32) {
        //Play/pause video
        if (player) {
          const time = player.getCurrentTime();
          if (isPlaying) {
            socket.emit("pauseEvent", time);
          } else {
            socket.emit("playEvent", time);
          }
        }
      }
    };
  }

  submitClicked() {
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

  syncToServer(time, playing, video) {
    if (!hasSynced) {
      this.setState({ url: video }, () => {
        if (player != null) {
          if (playing) {
            playVideo(time);
            player.playVideo();
          } else {
            player.seekTo(time);
            pauseVideo();
          }
        }
      });
    } else {
      if (player) {
        const time = player.getCurrentTime();
        if (isPlaying) {
          socket.emit("playEvent", time);
        } else {
          socket.emit("pauseEvent", time);
        }
      }
    }
  }

  render() {
    const opts = {
      height: "390pt",
      width: "100%",
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: 0,
        rel: 0,
        fs: 0,
        controls: 0,
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
              <div className="video" onClick={this.videoClicked.bind(this)}>
                <YouTube
                  containerClassName="ytplayer"
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
              <YoutubeControls
                socket={socket}
                time={this.state.time}
                duration={player ? player.getDuration() : 100.0}
              />
              <div className="flex-container mt-1 mb-2">
                <div className="remaining">
                  <TextFieldGroup
                    placeholder="Youtube url"
                    name="inputURL"
                    type="text"
                    value={this.state.inputURL}
                    onChange={this.onChange}
                    error={this.state.errors.invalid}
                  />
                </div>
                <div>
                  <button
                    onClick={this.submitClicked.bind(this)}
                    className={
                      "btn btn-info " +
                      (window.screen.availWidth > 600 ? "ml-2" : "")
                    }
                  >
                    Submit
                  </button>
                  <button
                    onClick={this.syncClicked.bind(this)}
                    className={
                      "btn btn-info " +
                      (window.screen.availWidth > 600 ? "ml-2" : "")
                    }
                  >
                    Sync
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  _onReady(event) {
    //Remove pointer events
    const ytplayer = document.getElementsByClassName("ytplayer");
    for (var i = 0; i < ytplayer.length; i++) {
      ytplayer[i].style.pointerEvents = "none";
    }
    // access to player in all event handlers via event.target
    player = event.target;

    //Emit sync to group to sync to other possible users
    socket.emit("syncToGroupEvent", socket.io.engine.id);
  }

  _onPlay() {
    hasSynced = true;
    isPlaying = true;
  }

  _onPause() {
    isPlaying = false;
  }

  _onEnd() {
    //Reset the video
    socket.emit("pauseEvent", "pause");
    resetVideo();
  }

  _onPlaybackRateChange() {
    socket.emit("playbackEvent", player.getPlaybackRate());
  }

  _onError() {
    var errors = {};
    errors.invalid = "Not a valid youtube url";

    this.setState({ errors: errors });

    socket.emit("newVideoEvent", defaultUrl);
  }

  syncClicked() {
    if (player) {
      const time = player.getCurrentTime();
      if (isPlaying) {
        socket.emit("playEvent", time);
      } else {
        socket.emit("pauseEvent", time);
      }
    }
  }

  videoClicked() {
    if (player) {
      const time = player.getCurrentTime();
      if (isPlaying) {
        socket.emit("pauseEvent", time);
      } else {
        socket.emit("playEvent", time);
      }
    }
  }
}
