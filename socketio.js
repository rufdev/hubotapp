module.exports = function (io) {

  io.on("connection", (socket) => {
    console.log("A client connected");

    //sample date from iot device
    socket.on("gps", (message) => {
      console.log("Received data:", message);
      // Broadcast the message to all connected clients
      io.emit("mapthiscar", message);
    });

    // Handle custom events
    socket.on("iotdata", (message) => {
      console.log("Received chat message:", message);
      // Broadcast the message to all connected clients
      io.emit("laravelclient", message);
    });

    socket.on("bedroomstate", (state) => {
      console.log("Received bedroom state:", state);
      fetch(`http://${process.env.ESP32IP}/led1/${state}`);
    });
    socket.on("livingroomstate", (state) => {
      console.log("Received livingroom state:", state);
      fetch(`http://${process.env.ESP32IP}/led2/${state}`);
    });
    socket.on("kitchenstate", (state) => {
      console.log("Received kitchen state:", state);
      fetch(`http://${process.env.ESP32IP}/led3/${state}`);
    });
    socket.on("bathroomstate", (state) => {
      console.log("Received bathroom state:", state);
      fetch(`http://${process.env.ESP32IP}/led4/${state}`);
    });

   
    socket.on("join", function (room) {
      console.log(room);
      socket.join(room);
    });

    socket.on("light", function (data) {
      console.log(data);
      io.to("car").emit("light", data);
    });
    socket.on("speed", function (data) {
      console.log(data);
      io.to("car").emit("speed", data);
    });
    socket.on("pan", function (data) {
      console.log(data);
      io.to("car").emit("pan", data);
    });
    socket.on("tilt", function (data) {
      console.log(data);
      io.to("car").emit("tilt", data);
    });

    socket.on("move", function (data) {
      console.log(data);
      io.to("car").emit("move", data);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });
};
