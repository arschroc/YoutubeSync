var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

const port = process.env.PORT || 5000;

io.on("connection", socket => {
  console.log("an user connected");
  console.log(" Number of users: " + io.engine.clientsCount);

  socket.on("disconnect", function() {
    console.log("DISCONNESSO!!!  with id: " + socket.id);
  });

  socket.on("pauseEvent", function(msg) {
    console.log("Pause message: " + msg);
    io.emit("pauseEvent", msg);
  });
  socket.on("playEvent", function(msg) {
    console.log("Play message: " + msg);
    io.emit("playEvent", msg);
  });
  socket.on("playbackEvent", function(msg) {
    //console.log(msg);
    io.emit("playbackEvent", msg);
  });
  socket.on("syncToGroupEvent", function(msg) {
    console.log("requesting syncing has id: " + msg);
    io.emit("syncToGroupEvent", msg);
  });
  socket.on("statusEvent", function(msg) {
    //console.log(msg);
    console.log("Status event msg id: " + msg.socketID);
    socket.broadcast.to(msg.socketID).emit("statusEvent", msg);
    io.emit("statusEvent", msg);
  });
  socket.on("newVideoEvent", function(msg) {
    //console.log(msg);
    io.emit("newVideoEvent", msg);
  });
  socket.on("seekEvent", function(msg) {
    //console.log(msg);
    io.emit("seekEvent", msg);
  });
  socket.on("numPlayersEvent", msg => {
    //onsole.log(io.engine.clientsCount);
    io.emit("numPlayersEvent", io.engine.clientsCount);
  });
});

http.listen(port, () => console.log(`Server running on port ${port}`));
