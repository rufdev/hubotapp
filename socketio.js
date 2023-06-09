module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("A client connected");

    // Handle custom events
    socket.on("iotdata", (message) => {
      console.log("Received chat message:", message);
      // Broadcast the message to all connected clients
      io.emit("datareceived", message);
    });

    socket.on("bedroomstate",(state)=> {
      console.log("Received bedroom state:", state);
      fetch(`http://${process.env.ESP32IP}/led1/${state}`)
    });
    socket.on("livingroomstate",(state)=> {
      console.log("Received livingroom state:", state);
      fetch(`http://${process.env.ESP32IP}/led2/${state}`)
    });
    socket.on("kitchenstate",(state)=> {
      console.log("Received kitchen state:", state);
      fetch(`http://${process.env.ESP32IP}/led3/${state}`)
    });
    socket.on("bathroomstate",(state)=> {
      console.log("Received bathroom state:", state);
      fetch(`http://${process.env.ESP32IP}/led4/${state}`)
    });
    
    

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });
};
