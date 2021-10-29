class WebSocketRoom {
  constructor(roomName) {
    this.roomName = roomName;

    this.rooms = [];
    this.members = [];
  }

  join(memberId) {
    this.members.push(memberId);
  }

  leave(memberId) {
    this.members = this.members.filter(member => member !== memberId);

    this.rooms.forEach(room => {
      room.leave(memberId);
    });
  }

  addRoom(room) {
    this.rooms.push(room);
  }
}

module.exports = WebSocketRoom;
