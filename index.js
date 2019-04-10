var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

const port = process.env.PORT || 5000;

io.on("connection", function(socket) {
  console.log("an user connected");
  socket.on("event", function(msg) {
    console.log("message: " + msg);
    io.emit("event", msg);
  });
  socket.on("playEvent", function(msg) {
    console.log("message: " + msg);
    io.emit("playEvent", msg);
  });
  socket.on("playbackEvent", function(msg) {
    console.log(msg);
    io.emit("playbackEvent", msg);
  });
  socket.on("syncToGroupEvent", function(msg) {
    console.log("syncing");
    io.emit("syncToGroupEvent", msg);
  });
  socket.on("statusEvent", function(msg) {
    console.log(msg);
    io.emit("statusEvent", msg);
  });
});

http.listen(port, () => console.log(`Server running on port ${port}`));
