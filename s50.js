const _pr50 = publicRoom;
publicRoom = function (room, viewerId) {
  const o = _pr50(room, viewerId);
  if (o.game && o.game.top) o.game.top = { color: o.game.top.color, type: o.game.top.type, value: o.game.top.value, fresh: false };
  if (o.game && o.game.hand) {
    /* own hand keeps fresh */
  }
  return o;
};
