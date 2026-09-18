from fastapi import WebSocket


class ConnectionManager:
    """Tracks one live WebSocket per (family_id, role) and pushes events to them.

    Roles: mom | dad | son | scammer. A manual presence override lets the demo
    controller simulate "phone switched off" independently of the socket
    actually being connected.
    """

    def __init__(self) -> None:
        self._connections: dict[str, dict[str, WebSocket]] = {}
        self._presence_override: dict[tuple[str, str], str] = {}

    async def connect(self, websocket: WebSocket, family_id: str, role: str) -> None:
        await websocket.accept()
        self._connections.setdefault(family_id, {})[role] = websocket
        self._presence_override.pop((family_id, role), None)

    def disconnect(self, websocket: WebSocket, family_id: str, role: str) -> bool:
        # Only evict if this is still the current connection for the role —
        # a stale connection (e.g. a reloaded tab) disconnecting later must
        # not evict a newer one that already took its place. Returns whether
        # this disconnect actually changed presence (caller uses this to
        # decide whether an OFFLINE event is warranted).
        if self._connections.get(family_id, {}).get(role) is websocket:
            self._connections[family_id].pop(role, None)
            return True
        return False

    def is_online(self, family_id: str, role: str) -> bool:
        override = self._presence_override.get((family_id, role))
        if override is not None:
            return override == "online"
        return role in self._connections.get(family_id, {})

    def set_presence_override(self, family_id: str, role: str, status: str) -> None:
        self._presence_override[(family_id, role)] = status

    async def send_to_role(self, family_id: str, role: str, message: dict) -> bool:
        ws = self._connections.get(family_id, {}).get(role)
        if ws is None:
            return False
        try:
            await ws.send_json(message)
        except Exception:
            self.disconnect(ws, family_id, role)
            return False
        return True

    async def broadcast(self, family_id: str, message: dict, exclude_role: str | None = None) -> None:
        # One dead socket must not stop the event from reaching everyone else
        # in the family (e.g. a Family Shield alert still has to reach Dad
        # even if Mom's tab just dropped).
        for role, ws in list(self._connections.get(family_id, {}).items()):
            if role == exclude_role:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(ws, family_id, role)

manager = ConnectionManager()
