import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const STAFF = {
  owner: { name: "Owner", icon: "👑", text: "Official creator and owner of Vexel." },
  developer: { name: "Developer", icon: "💻", text: "Official Vexel development staff." },
  coowner: { name: "Co-Owner", icon: "⭐", text: "Official Vexel co-owner." },
  admin: { name: "Admin", icon: "🛡️", text: "Official Vexel administrator." },
  moderator: { name: "Moderator", icon: "🔨", text: "Official Vexel moderator." },
};

const SERVER_PERMISSIONS = {
  view_channels: "View Channels",
  send_messages: "Send Messages",
  join_voice: "Join Voice",
  speak: "Speak in Voice",
  manage_messages: "Manage Messages",
  manage_members: "Manage Members",
  manage_roles: "Manage Roles",
  manage_channels: "Manage Channels",
  manage_server: "Manage Server",
  administrator: "Administrator"
};

const DEFAULT_SERVER_PERMISSIONS = {
  view_channels: true,
  send_messages: true,
  join_voice: true,
  speak: true,
  manage_messages: false,
  manage_members: false,
  manage_roles: false,
  manage_channels: false,
  manage_server: false,
  administrator: false
};

const uid = () => crypto.randomUUID();

function Avatar({ user, small = false }) {
  const initials = (user?.display_name || user?.username || "?")
    .split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
  return user?.avatar_url
    ? <img className={`avatar ${small ? "small" : ""}`} src={user.avatar_url} alt="" />
    : <div className={`avatar ${small ? "small" : ""}`}>{initials}</div>;
}

function StaffBadge({ badge, onClick }) {
  const b = STAFF[badge];
  if (!b) return null;
  return <button type="button" className="staff-badge" title={b.text} onClick={onClick}>{b.icon} {b.name}</button>;
}

function StaffBadgesUnderName({ user, onBadgeClick }) {
  const badges = Array.isArray(user?.staff_badges) ? user.staff_badges.filter(b => STAFF[b]) : [];
  if (!badges.length) return null;
  return <div className="profile-staff-row">
    {badges.map(b => <StaffBadge key={b} badge={b} onClick={() => onBadgeClick?.(b)} />)}
  </div>;
}

function Auth({ onDone }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onDone();
      } else {
        if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) throw new Error("Username must be 3-24 letters, numbers, or underscores.");
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username, display_name: displayName || username } }
        });
        if (error) throw error;
        if (!data.session) {
          setError("Check your email to confirm the account, then sign in.");
        } else onDone();
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally { setBusy(false); }
  }

  return <div className="auth">
    <div className="auth-card">
      <div className="logo">V</div>
      <h1>Vexel</h1>
      <p>Real accounts, servers, DMs, presence, and voice.</p>
      <form onSubmit={submit}>
        {mode === "signup" && <>
          <label>Vexel @username</label>
          <input value={username} onChange={e => setUsername(e.target.value.replace(/^@/, ""))} placeholder="@username" required />
          <label>Display name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" />
        </>}
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}</button>
      </form>
      <button className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
        {mode === "login" ? "Create a Vexel account" : "I already have an account"}
      </button>
    </div>
  </div>;
}

function ProfileModal({ user, onClose, onSave, isSelf, onUploadAvatar, uploadingAvatar }) {
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [pronouns, setPronouns] = useState(user.pronouns || "");
  const fileRef = useRef(null);

  async function save(e) {
    e.preventDefault();
    await onSave({
      display_name: displayName.trim(),
      username: username.trim().toLowerCase(),
      bio,
      pronouns
    });
    onClose();
  }

  async function chooseAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await onUploadAvatar(file);
  }

  return <div className="modal-bg"><div className="modal">
    <button className="close" onClick={onClose}>×</button>
    <div className="profile-top">
      <div className="profile-avatar-wrap">
        <Avatar user={user} />
        {isSelf && <button className="avatar-edit-btn" type="button" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}>
          {uploadingAvatar ? "⏳" : "📷"}
        </button>}
        <input ref={fileRef} type="file" accept="image/*" onChange={chooseAvatar} hidden />
      </div>
      <div className="profile-name-block"><h2>{user.display_name}</h2><div className="profile-username">@{user.username}</div><StaffBadgesUnderName user={user} onBadgeClick={() => {}} /></div>
    </div>

    {!isSelf ? <div className="profile-read">
      <p>{user.bio || "No bio yet."}</p>
      {user.pronouns && <p>Pronouns: {user.pronouns}</p>}
      <div className="badges">{(user.staff_badges || []).map(b => <StaffBadge key={b} badge={b} />)}</div>
    </div> : <form onSubmit={save}>
      <div className="upload-hint">🖼️ Click the camera button above to choose a profile picture from your phone or computer.</div>
      <label>Display name</label><input value={displayName} onChange={e => setDisplayName(e.target.value)} />
      <label>@username</label><input value={username} onChange={e => setUsername(e.target.value.replace(/^@/, ""))} />
      <label>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} />
      <label>Pronouns</label><input value={pronouns} onChange={e => setPronouns(e.target.value)} />
      <button className="primary">Save Profile</button>
    </form>}
  </div></div>;
}

function AddPeople({ users, onPick, onClose }) {
  const [q, setQ] = useState("");
  const results = users.filter(u => (`${u.username} ${u.display_name}`).toLowerCase().includes(q.replace(/^@/, "").toLowerCase()));
  return <div className="modal-bg"><div className="modal">
    <button className="close" onClick={onClose}>×</button>
    <h2>Add People</h2><p>Search by Vexel @username.</p>
    <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="@username" />
    <div className="results">{results.map(u => <button className="result" key={u.id} onClick={() => onPick(u)}><Avatar user={u} small /><span><b>{u.display_name}</b><small>@{u.username}</small></span></button>)}</div>
  </div></div>;
}

function Voice({ channel, me, profiles, onLeave }) {
  const [members, setMembers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [camera, setCamera] = useState(false);
  const [screen, setScreen] = useState(false);
  const [remote, setRemote] = useState({});
  const localVideo = useRef(null);
  const localStream = useRef(null);
  const screenTrack = useRef(null);
  const peers = useRef({});
  const room = useRef(null);

  const userById = id => profiles.find(p => p.id === id);

  function sendSignal(payload) {
    room.current?.send({ type: "broadcast", event: "signal", payload });
  }

  async function makePeer(peerId, offer) {
    if (peers.current[peerId]) return peers.current[peerId];
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peers.current[peerId] = pc;
    (localStream.current ? [...localStream.current.getTracks()] : []).forEach(t => pc.addTrack(t, localStream.current));
    pc.onicecandidate = e => e.candidate && sendSignal({ kind: "ice", to: peerId, from: me.id, candidate: e.candidate });
    pc.ontrack = e => setRemote(r => ({ ...r, [peerId]: { ...(r[peerId] || {}), stream: e.streams[0] } }));
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        pc.close(); delete peers.current[peerId];
        setRemote(r => { const n = { ...r }; delete n[peerId]; return n; });
      }
    };
    if (offer) {
      const o = await pc.createOffer();
      await pc.setLocalDescription(o);
      sendSignal({ kind: "offer", to: peerId, from: me.id, description: pc.localDescription });
    }
    return pc;
  }

  async function join() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: camera });
      localStream.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;
      const { error } = await supabase.from("voice_presence").upsert({ channel_id: channel.id, user_id: me.id, muted: false, deafened: false, camera_on: camera, screen_sharing: false });
      if (error) throw error;
      const { data } = await supabase.from("voice_presence").select("user_id").eq("channel_id", channel.id);
      setMembers((data || []).map(x => x.user_id));
      room.current = supabase.channel(`voice:${channel.id}`);
      room.current.on("broadcast", { event: "signal" }, async ({ payload }) => {
        if (payload.to && payload.to !== me.id) return;
        if (payload.kind === "join" && payload.from !== me.id && me.id < payload.from) await makePeer(payload.from, true);
        if (payload.kind === "offer" && payload.to === me.id) {
          const pc = await makePeer(payload.from, false);
          await pc.setRemoteDescription(payload.description);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ kind: "answer", to: payload.from, from: me.id, description: pc.localDescription });
        }
        if (payload.kind === "answer" && payload.to === me.id && peers.current[payload.from]) await peers.current[payload.from].setRemoteDescription(payload.description);
        if (payload.kind === "ice" && payload.to === me.id && peers.current[payload.from]) {
          try { await peers.current[payload.from].addIceCandidate(payload.candidate); } catch {}
        }
        if (payload.kind === "leave") {
          const pc = peers.current[payload.from]; if (pc) pc.close(); delete peers.current[payload.from];
          setRemote(r => { const n = { ...r }; delete n[payload.from]; return n; });
        }
      }).subscribe(async status => {
        if (status === "SUBSCRIBED") {
          setJoined(true);
          sendSignal({ kind: "join", from: me.id });
          for (const id of (data || []).map(x => x.user_id)) if (id !== me.id && me.id < id) await makePeer(id, true);
        }
      });
    } catch (e) { alert(e.message || "Microphone/camera permission failed."); }
  }

  async function leave() {
    await supabase.from("voice_presence").delete().eq("channel_id", channel.id).eq("user_id", me.id);
    sendSignal({ kind: "leave", from: me.id });
    room.current && supabase.removeChannel(room.current);
    Object.values(peers.current).forEach(p => p.close());
    peers.current = {};
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    setRemote({}); setJoined(false); onLeave();
  }

  async function toggleCamera() {
    if (!joined) return;
    if (camera) {
      const track = localStream.current?.getVideoTracks()[0];
      track?.stop();
      for (const pc of Object.values(peers.current)) pc.getSenders().filter(s => s.track?.kind === "video").forEach(s => s.replaceTrack(null));
      setCamera(false);
      await supabase.from("voice_presence").update({ camera_on: false }).eq("channel_id", channel.id).eq("user_id", me.id);
    } else {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = s.getVideoTracks()[0];
      localStream.current.addTrack(track);
      for (const pc of Object.values(peers.current)) pc.addTrack(track, localStream.current);
      if (localVideo.current) localVideo.current.srcObject = localStream.current;
      setCamera(true);
      await supabase.from("voice_presence").update({ camera_on: true }).eq("channel_id", channel.id).eq("user_id", me.id);
    }
  }

  async function toggleScreen() {
    if (!joined) return;
    if (screen) {
      screenTrack.current?.stop(); screenTrack.current = null; setScreen(false);
      await supabase.from("voice_presence").update({ screen_sharing: false }).eq("channel_id", channel.id).eq("user_id", me.id);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = s.getVideoTracks()[0]; screenTrack.current = track;
      for (const pc of Object.values(peers.current)) {
        const sender = pc.getSenders().find(x => x.track?.kind === "video");
        if (sender) await sender.replaceTrack(track);
        else pc.addTrack(track, localStream.current);
      }
      track.onended = () => toggleScreen();
      setScreen(true);
      await supabase.from("voice_presence").update({ screen_sharing: true }).eq("channel_id", channel.id).eq("user_id", me.id);
    } catch {}
  }

  async function toggleMute() {
    if (!localStream.current) return;
    const next = !muted; localStream.current.getAudioTracks().forEach(t => t.enabled = !next); setMuted(next);
    await supabase.from("voice_presence").update({ muted: next }).eq("channel_id", channel.id).eq("user_id", me.id);
  }

  async function toggleDeafen() {
    const next = !deafened; setDeafened(next);
    await supabase.from("voice_presence").update({ deafened: next }).eq("channel_id", channel.id).eq("user_id", me.id);
  }

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("voice_presence").select("*").eq("channel_id", channel.id);
      setMembers((data || []).map(x => x.user_id));
    };
    load();
    const sub = supabase.channel(`voice-presence:${channel.id}`).on("postgres_changes", { event: "*", schema: "public", table: "voice_presence", filter: `channel_id=eq.${channel.id}` }, p => {
      if (p.eventType === "DELETE") setMembers(m => m.filter(id => id !== p.old.user_id));
      else setMembers(m => Array.from(new Set([...m, p.new.user_id])));
    }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [channel.id]);

  useEffect(() => () => { if (joined) leave(); }, []);

  return <main className="main">
    <header className="header"><b>🔊 {channel.name}</b><span>Voice channel</span></header>
    <div className="voice">
      <h2>{joined ? "You're in the voice channel" : "Join the voice channel"}</h2>
      <p>Voice, camera, screen sharing, mute, and deafen are connected with WebRTC.</p>
      <div className="voice-grid">
        {joined && <div className="video-tile"><video ref={localVideo} autoPlay muted playsInline /><b>{me.display_name} (You)</b></div>}
        {Object.entries(remote).map(([id, x]) => <RemoteVideo key={id} id={id} stream={x.stream} deafened={deafened} user={userById(id)} />)}
      </div>
      <div className="member-list"><b>👀 In voice ({members.length})</b>{members.map(id => <div key={id}><Avatar user={userById(id)} small /> {userById(id)?.display_name || id}</div>)}</div>
      <div className="controls">
        {!joined ? <button className="primary" onClick={join}>🔊 Join Voice</button> : <>
          <button onClick={toggleMute}>{muted ? "🎙️ Unmute" : "🎤 Mute"}</button>
          <button onClick={toggleDeafen}>{deafened ? "🔊 Undeafen" : "🔇 Deafen"}</button>
          <button onClick={toggleCamera}>{camera ? "📹 Camera Off" : "📹 Camera On"}</button>
          <button onClick={toggleScreen}>{screen ? "🖥️ Stop Share" : "🖥️ Share Screen"}</button>
          <button className="danger" onClick={leave}>📞 Leave</button>
        </>}
      </div>
    </div>
  </main>;
}

function RemoteVideo({ id, stream, deafened, user }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <div className="video-tile"><video ref={ref} autoPlay playsInline muted={deafened} /><b>{user?.display_name || id}</b></div>;
}

function ServerRolesModal({ server, members, profiles, roles, roleMembers, canManage, onClose, onCreateRole, onUpdateRole, onDeleteRole, onAssignRole, onRemoveRole }) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || null);
  const [newName, setNewName] = useState("");
  const selectedRole = roles.find(r => r.id === selectedRoleId) || roles[0];
  const assignedIds = new Set((roleMembers || []).filter(x => x.role_id === selectedRole?.id).map(x => x.user_id));

  function permissionsFor(role) {
    return { ...DEFAULT_SERVER_PERMISSIONS, ...(role?.permissions || {}) };
  }

  async function create() {
    const name = newName.trim();
    if (!name) return;
    const role = await onCreateRole({ name, color: "#5b8cff", permissions: DEFAULT_SERVER_PERMISSIONS });
    if (role?.id) { setSelectedRoleId(role.id); setNewName(""); }
  }

  if (!canManage) return null;
  return <div className="modal-bg"><div className="modal role-modal">
    <button className="close" onClick={onClose}>×</button>
    <div className="profile-top"><div><h2>🏷️ Server Roles</h2><span>{server?.name} · Create roles, permissions, and member assignments</span></div></div>
    <div className="role-layout">
      <div className="role-list">
        <b>Roles</b>
        {roles.map(role => <button key={role.id} className={selectedRole?.id === role.id ? "role-item selected" : "role-item"} onClick={() => setSelectedRoleId(role.id)}>
          <span className="role-dot" style={{background: role.color || "#5b8cff"}} /> <span>{role.name}</span>
        </button>)}
        <div className="role-create"><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New role name" /><button className="primary" onClick={create}>＋ Create</button></div>
      </div>
      <div className="role-editor">
        {selectedRole ? <>
          <label>Role name</label>
          <input value={selectedRole.name} onChange={e => onUpdateRole(selectedRole, {name:e.target.value})} />
          <label>Role color</label>
          <input type="color" value={selectedRole.color || "#5b8cff"} onChange={e => onUpdateRole(selectedRole, {color:e.target.value})} />
          <h3>🔐 Permissions</h3>
          <div className="permission-grid">{Object.entries(SERVER_PERMISSIONS).map(([key,label]) => {
            const checked = !!permissionsFor(selectedRole)[key];
            return <label className="permission-row" key={key}><input type="checkbox" checked={checked} onChange={e => onUpdateRole(selectedRole, {permissions:{...permissionsFor(selectedRole), [key]:e.target.checked}})} /><span>{label}</span></label>;
          })}</div>
          <h3>👥 Members with this role</h3>
          <div className="admin-list">{members.map(id => { const user = profiles.find(p => p.id === id); if (!user) return null; const has = assignedIds.has(id); return <div className="admin-row" key={id}><Avatar user={user} small /><div className="grow"><b>{user.display_name}</b><small>@{user.username}</small></div><button className={has ? "active" : ""} onClick={() => has ? onRemoveRole(selectedRole.id,id) : onAssignRole(selectedRole.id,id)}>{has ? "✓ Assigned" : "Assign"}</button></div>; })}</div>
          {selectedRole.name !== "Member" && <button className="danger" style={{marginTop:14}} onClick={() => onDeleteRole(selectedRole)}>🗑️ Delete Role</button>}
        </> : <div className="admin-card">Create a role to get started.</div>}
      </div>
    </div>
  </div></div>;
}


function ChannelAccessModal({ channel, roles, onSave, onClose }) {
  const [locked, setLocked] = useState(!!channel?.is_locked);
  const [allowed, setAllowed] = useState(new Set(channel?.allowed_role_ids || []));
  const [saving, setSaving] = useState(false);

  function toggleRole(id) {
    setAllowed(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await onSave(channel, locked, Array.from(allowed));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-bg">
    <div className="modal role-modal">
      <button className="close" onClick={onClose}>×</button>
      <div className="profile-top">
        <div>
          <h2>🔒 Channel Access</h2>
          <span>#{channel?.name} · Control who can send messages</span>
        </div>
      </div>
      <div className="admin-section">
        <label className="permission-row" style={{cursor:"pointer"}}>
          <input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)} />
          <span><b>Lock this channel</b><small style={{display:"block",color:"#8190a7"}}>Everyone can still see the channel and its messages, but only the server owner and selected roles can send messages.</small></span>
        </label>
      </div>
      <h3>🏷️ Roles allowed to send</h3>
      <p className="admin-muted">Select the server roles that should be able to type while this channel is locked. Those roles must also have the Send Messages permission.</p>
      <div className="admin-list">
        {roles.map(role => {
          const checked = allowed.has(role.id);
          return <label className="permission-row" key={role.id} style={{cursor:"pointer"}}>
            <input type="checkbox" checked={checked} onChange={() => toggleRole(role.id)} />
            <span><b>{role.name}</b><small style={{display:"block",color:"#8190a7"}}>{role.permissions?.send_messages ? "Can send messages" : "Does not have Send Messages"}</small></span>
          </label>;
        })}
        {!roles.length && <div className="admin-card">No server roles are available.</div>}
      </div>
      <div className="admin-actions" style={{marginTop:14}}>
        <button onClick={onClose}>Cancel</button>
        <button className="primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save Channel Access"}</button>
      </div>
    </div>
  </div>;
}

function InstallVexelModal({ canInstall, onInstall, onClose }) {
  const [platform, setPlatform] = useState("desktop");

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const touch = navigator.maxTouchPoints > 0;
    if (/iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && touch)) setPlatform("ios");
    else if (/Android/i.test(ua)) setPlatform("android");
    else if (/Xbox/i.test(ua)) setPlatform("xbox");
    else if (/Quest|Pico|VR|Valve Index|Vive/i.test(ua)) setPlatform("vr");
    else if (/CrOS/i.test(ua)) setPlatform("chromebook");
    else if (/Macintosh|Mac OS X/i.test(ua)) setPlatform("mac");
    else if (/Windows/i.test(ua)) setPlatform("windows");
    else setPlatform("desktop");
  }, []);

  const instructions = {
    ios: { title: "iPhone & iPad", steps: ["Open Vexel in Safari.", "Tap the Share button.", "Choose Add to Home Screen.", "Tap Add. Vexel will open like an app."] },
    android: { title: "Android", steps: ["Open Vexel in Chrome.", "Tap the browser menu.", "Choose Install app or Add to Home screen.", "Confirm the installation."] },
    chromebook: { title: "Chromebook", steps: ["Open Vexel in Chrome.", "Use the Install icon in the address bar when it appears.", "Choose Install.", "Launch Vexel from your Chromebook apps."] },
    windows: { title: "Windows PC", steps: ["Open Vexel in Chrome or Edge.", "Use the Install icon in the address bar when it appears.", "Choose Install.", "Vexel can then open in its own app window."] },
    mac: { title: "macOS", steps: ["Open Vexel in a supported browser such as Chrome or Edge.", "Use the browser's Install option when available.", "Choose Install.", "Launch Vexel from the installed web app."] },
    vr: { title: "VR headset", steps: ["Open Vexel using the headset's web browser.", "If the browser supports web-app installation, use its install/add-to-home option.", "Otherwise, bookmark Vexel for quick access."] },
    xbox: { title: "Xbox", steps: ["Open Vexel in Microsoft Edge on Xbox.", "Sign in normally.", "Save Vexel as a favorite for quick access.", "A native Xbox Store app would require a separate Xbox app release."] },
    desktop: { title: "Computer", steps: ["Open Vexel in Chrome or Edge.", "Use the Install icon in the address bar when it appears.", "Choose Install.", "Vexel will open in an app-style window."] }
  }[platform];

  return <div className="modal-bg"><div className="modal install-modal">
    <button className="close" onClick={onClose}>×</button>
    <div className="profile-top"><div><h2>📦 Install Vexel</h2><span>Use Vexel like an app on supported devices.</span></div></div>
    {canInstall && <div className="upload-hint" style={{marginTop:12}}>Vexel can be installed directly on this device.</div>}
    <div className="install-platforms">
      {[["ios","📱 iPhone / iPad"],["android","🤖 Android"],["windows","💻 Windows"],["mac","🍎 macOS"],["chromebook","💻 Chromebook"],["vr","🥽 VR"],["xbox","🎮 Xbox"]].map(([key,label]) => <button type="button" key={key} className={platform===key ? "active" : ""} onClick={() => setPlatform(key)}>{label}</button>)}
    </div>
    <div className="install-guide">
      <h3>{instructions.title}</h3>
      <ol>{instructions.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
    </div>
    {canInstall && <button type="button" className="primary install-now" onClick={onInstall}>⬇ Install Vexel now</button>}
    <p className="admin-muted" style={{marginTop:12}}>Xbox and some VR browsers use Vexel through their browser. Native store apps for those platforms are separate releases.</p>
  </div></div>;
}

const VEXEL_MINI_GAMES = [
  { id: "tictactoe", name: "Tic-Tac-Toe", icon: "⭕" },
  { id: "rps", name: "Rock Paper Scissors", icon: "✊" },
  { id: "guess", name: "Guess the Word", icon: "💡" },
  { id: "quicktap", name: "Quick Tap", icon: "⚡" },
];

function MiniGamesModal({ game, onClose }) {
  const [board, setBoard] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("X");
  const [rpsResult, setRpsResult] = useState("");
  const [word, setWord] = useState("");
  const [guess, setGuess] = useState("");
  const [tapStart, setTapStart] = useState(null);
  const [tapResult, setTapResult] = useState("");

  const words = ["VEXEL", "SERVER", "GAMING", "FRIEND", "VOICE"];

  function resetTicTacToe() {
    setBoard(Array(9).fill(""));
    setTurn("X");
  }

  function checkWinner(next) {
    const wins = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    for (const [a,b,c] of wins) {
      if (next[a] && next[a] === next[b] && next[a] === next[c]) {
        return next[a];
      }
    }

    return next.every(Boolean) ? "draw" : null;
  }

  function playTicTacToe(index) {
    if (board[index]) return;

    const next = [...board];
    next[index] = turn;

    const winner = checkWinner(next);
    setBoard(next);

    if (!winner) {
      setTurn(turn === "X" ? "O" : "X");
    }
  }

  function playRps(choice) {
    const choices = ["Rock", "Paper", "Scissors"];
    const computer = choices[Math.floor(Math.random() * choices.length)];

    if (choice === computer) {
      setRpsResult(`You both picked ${computer}. Draw!`);
    } else if (
      (choice === "Rock" && computer === "Scissors") ||
      (choice === "Paper" && computer === "Rock") ||
      (choice === "Scissors" && computer === "Paper")
    ) {
      setRpsResult(`You picked ${choice}. Vexel picked ${computer}. You win! 🎉`);
    } else {
      setRpsResult(`You picked ${choice}. Vexel picked ${computer}. Try again!`);
    }
  }

  function startGuessGame() {
    setWord(words[Math.floor(Math.random() * words.length)]);
    setGuess("");
    setTapResult("");
  }

  function checkGuess() {
    if (!word) startGuessGame();

    if (guess.trim().toUpperCase() === word) {
      setRpsResult("Correct! 🎉");
    } else {
      setRpsResult("Not quite — try again!");
    }
  }

  function startQuickTap() {
    setTapStart(Date.now());
    setTapResult("GO!");
  }

  function finishQuickTap() {
    if (!tapStart) return;

    const time = Date.now() - tapStart;
    setTapResult(`Your reaction time: ${time} ms`);
    setTapStart(null);
  }

  return (
    <div className="modal-bg">
      <div className="modal mini-games-modal">
        <button className="close" type="button" onClick={onClose}>×</button>

        <div className="hub-kicker">VEXEL ARCADE</div>
        <h2>🎮 Mini Games</h2>
        <p className="admin-muted">
          Quick games you can play while hanging out in Vexel.
        </p>

        <div className="mini-game-tabs">
          {VEXEL_MINI_GAMES.map(item => (
            <button
              key={item.id}
              className={game === item.id ? "active" : ""}
              onClick={() => {
                setRpsResult("");
                setTapResult("");
                onClose(item.id);
              }}
            >
              {item.icon} {item.name}
            </button>
          ))}
        </div>

        {game === "tictactoe" && (
          <div className="mini-game-card">
            <h3>⭕ Tic-Tac-Toe</h3>
            <p>Turn: {turn}</p>

            <div className="tic-board">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => playTicTacToe(index)}
                  className="tic-cell"
                >
                  {cell}
                </button>
              ))}
            </div>

            <button className="primary" onClick={resetTicTacToe}>
              Restart
            </button>
          </div>
        )}

        {game === "rps" && (
          <div className="mini-game-card">
            <h3>✊ Rock Paper Scissors</h3>

            <div className="game-buttons">
              <button onClick={() => playRps("Rock")}>✊ Rock</button>
              <button onClick={() => playRps("Paper")}>📄 Paper</button>
              <button onClick={() => playRps("Scissors")}>✂️ Scissors</button>
            </div>

            {rpsResult && <div className="game-result">{rpsResult}</div>}
          </div>
        )}

        {game === "guess" && (
          <div className="mini-game-card">
            <h3>💡 Guess the Word</h3>

            <p>
              Guess a Vexel-related word.
            </p>

            <button className="primary" onClick={startGuessGame}>
              New Word
            </button>

            {word && (
              <>
                <input
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  placeholder="Your guess..."
                />

                <button className="primary" onClick={checkGuess}>
                  Check Guess
                </button>
              </>
            )}

            {rpsResult && <div className="game-result">{rpsResult}</div>}
          </div>
        )}

        {game === "quicktap" && (
          <div className="mini-game-card">
            <h3>⚡ Quick Tap</h3>

            <p>Click the button as fast as you can.</p>

            {!tapStart ? (
              <button className="quick-tap" onClick={startQuickTap}>
                START
              </button>
            ) : (
              <button className="quick-tap" onClick={finishQuickTap}>
                TAP!
              </button>
            )}

            {tapResult && <div className="game-result">{tapResult}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
function VexelHomeHub({ me, servers, visibleProfiles, onAddPeople, onCreateServer, onJoinServer, onOpenProfile, onInstall, onMiniGames }) {
  const online = visibleProfiles.filter(u => String(u.status || '').toLowerCase() === 'online').length;
  return <div className="vexel-hub">
    <section className="hub-hero">
      <div className="hub-mark">V</div>
      <div className="hub-copy">
        <span className="hub-kicker">VEXEL HUB</span>
        <h1>Welcome back, {me?.display_name || me?.username || 'there'}.</h1>
        <p>Your people, spaces, and conversations — organized your way.</p>
      </div>
      <div className="hub-actions">
        <button type="button" onClick={onAddPeople}>＋ Add People</button>
        <button type="button" onClick={onJoinServer}>Enter Server Code</button>
        <button type="button" onClick={onInstall}>📦 Install Vexel</button>
      </div>
    </section>
    <section className="hub-grid">
      <button type="button" className="hub-card" onClick={onAddPeople}>
        <span className="hub-icon">◎</span><div><b>People</b><small>{visibleProfiles.length} available connections · {online} online</small></div>
      </button>
      <button type="button" className="hub-card" onClick={onCreateServer}>
        <span className="hub-icon">＋</span><div><b>Create a Space</b><small>Build a server with your own identity and rules</small></div>
      </button>
            <button type="button" className="hub-card" onClick={onMiniGames}>
        <span className="hub-icon">🎮</span>
        <div>
          <b>Mini Games</b>
          <small>Play quick games with your friends</small>
        </div>
      </button>
      <button type="button" className="hub-card" onClick={onOpenProfile}>
        <span className="hub-icon">◌</span><div><b>Your Profile</b><small>Customize your Vexel identity and connections</small></div>
      </button>
    </section>
    <section className="hub-section">
      <div className="hub-section-head"><div><span className="hub-kicker">YOUR SPACES</span><h2>Jump back in</h2></div><span>{servers.length} spaces</span></div>
      {servers.length ? <div className="hub-space-list">{servers.slice(0, 6).map(s => <div className="hub-space" key={s.id}>
        <div className="hub-space-icon">{s.icon_url ? <img src={s.icon_url} alt="" /> : (s.name || 'S').slice(0,1).toUpperCase()}</div>
        <div><b>{s.name}</b><small>{s.description || 'Vexel space'}</small></div>
      </div>)}</div> : <div className="hub-empty">You haven't joined any spaces yet. Use <b>Enter Server Code</b> to join one.</div>}
    </section>
  </div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [serverMembers, setServerMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dmMessages, setDmMessages] = useState([]);
  const [serverMessagesByChannel, setServerMessagesByChannel] = useState({});
  const [dmMessagesByConversation, setDmMessagesByConversation] = useState({});
  const [dmUserId, setDmUserId] = useState(null);
  const [dmConversationId, setDmConversationId] = useState(null);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [profileOpen, setProfileOpen] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState("overview");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingServerMedia, setUploadingServerMedia] = useState(false);
  const [serverDraft, setServerDraft] = useState({ name: "", description: "" });
  const [serverRoles, setServerRoles] = useState([]);
  const [serverRoleMembers, setServerRoleMembers] = useState([]);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [channelAccessOpen, setChannelAccessOpen] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const [miniGame, setMiniGame] = useState(null);
  const [unreadServerChannels, setUnreadServerChannels] = useState({});
const [unreadDmConversations, setUnreadDmConversations] = useState({});
const [dmConversationByUser, setDmConversationByUser] = useState({});

  const [page, setPage] = useState("home");
  const [serverId, setServerId] = useState(null);
  const [channelId, setChannelId] = useState(null);

  const serverIconRef = useRef(null);
  const serverBannerRef = useRef(null);

  const selectedServer = servers.find(s => s.id === serverId);
  const selectedChannel = channels.find(c => c.id === channelId);
  const selectedDmUser = profiles.find(p => p.id === dmUserId);

  const staffBadges = me?.staff_badges || [];
  const staffKeys = staffBadges.map(x => String(x).toLowerCase());
  const isOwner = staffKeys.includes("owner");
  const canUseAdminPanel = isOwner || staffKeys.some(x => ["developer", "coowner", "admin"].includes(x));
  const canManageStaff = isOwner;
  const canModerate = canUseAdminPanel || staffKeys.includes("moderator");
  const isServerOwner = selectedServer?.owner_id === me?.id;

  function myServerPermissions() {
    if (!selectedServer || !me) return {};
    if (selectedServer.owner_id === me.id) return Object.fromEntries(Object.keys(SERVER_PERMISSIONS).map(k => [k, true]));
    const roleIds = new Set(serverRoleMembers.filter(x => x.user_id === me.id).map(x => x.role_id));
    const perms = {};
    for (const role of serverRoles) if (roleIds.has(role.id)) Object.assign(perms, role.permissions || {});
    if (perms.administrator) return Object.fromEntries(Object.keys(SERVER_PERMISSIONS).map(k => [k, true]));
    return perms;
  }

  function hasServerPermission(permission) {
    return isServerOwner || !!myServerPermissions()[permission] || canUseAdminPanel;
  }

  function canSendToChannel(channel = selectedChannel) {
    if (!channel || channel.type !== "text") return false;
    if (!hasServerPermission("send_messages")) return false;
    if (!channel.is_locked) return true;
    if (isServerOwner) return true;
    const roleIds = new Set(serverRoleMembers.filter(x => x.user_id === me?.id).map(x => x.role_id));
    return (channel.allowed_role_ids || []).some(id => roleIds.has(id));
  }

  async function startPrivateCall(user) {
    if (!user?.id || !me?.id || !dmConversationId) return notify("Open the DM before starting a call.");
    const inviteRoom = supabase.channel(`call-invite:${user.id}`);
    inviteRoom.subscribe(async status => {
      if (status === "SUBSCRIBED") {
        await inviteRoom.send({
          type: "broadcast",
          event: "incoming-call",
          payload: { callerId: me.id, callerName: me.display_name, conversationId: dmConversationId }
        });
        setTimeout(() => supabase.removeChannel(inviteRoom), 2500);
      }
    });
    setVoiceOpen(true);
  }

  async function refreshServerRoles(id = serverId) {
    if (!id) return;
    const [{ data: rs }, { data: rms }] = await Promise.all([
      supabase.from("server_roles").select("*").eq("server_id", id).order("position", { ascending: false }),
      supabase.from("server_role_members").select("role_id,user_id")
    ]);
    setServerRoles(rs || []);
    setServerRoleMembers((rms || []).filter(x => serverMembers.includes(x.user_id)));
  }

  async function createServerRole(payload) {
    if (!hasServerPermission("manage_roles")) return notify("You do not have permission to manage roles.");
    const max = serverRoles.reduce((n,r) => Math.max(n, Number(r.position || 0)), 0);
    const { data, error } = await supabase.from("server_roles").insert({ server_id: serverId, name: payload.name, color: payload.color, permissions: payload.permissions, position: max + 1 }).select().single();
    if (error) { notify(error.message); return null; }
    setServerRoles(r => [...r, data].sort((a,b) => (b.position||0)-(a.position||0)));
    notify("Role created.");
    return data;
  }

  async function updateServerRole(role, patch) {
    if (!hasServerPermission("manage_roles")) return;
    const { data, error } = await supabase.from("server_roles").update(patch).eq("id", role.id).select().single();
    if (error) return notify(error.message);
    setServerRoles(r => r.map(x => x.id === role.id ? data : x));
  }

  async function deleteServerRole(role) {
    if (!hasServerPermission("manage_roles")) return;
    if (!confirm(`Delete the ${role.name} role?`)) return;
    const { error } = await supabase.from("server_roles").delete().eq("id", role.id);
    if (error) return notify(error.message);
    setServerRoles(r => r.filter(x => x.id !== role.id));
    setServerRoleMembers(r => r.filter(x => x.role_id !== role.id));
    notify("Role deleted.");
  }

  async function assignServerRole(roleId, userId) {
    if (!hasServerPermission("manage_roles")) return notify("You do not have permission to assign roles.");
    const { error } = await supabase.from("server_role_members").insert({ role_id: roleId, user_id: userId });
    if (error) return notify(error.message);
    setServerRoleMembers(r => [...r, { role_id: roleId, user_id: userId }]);
  }

  async function removeServerRole(roleId, userId) {
    if (!hasServerPermission("manage_roles")) return notify("You do not have permission to remove roles.");
    const { error } = await supabase.from("server_role_members").delete().eq("role_id", roleId).eq("user_id", userId);
    if (error) return notify(error.message);
    setServerRoleMembers(r => r.filter(x => !(x.role_id === roleId && x.user_id === userId)));
  }

  function notify(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  }

  async function refreshProfile(authUser) {
    let { data, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (error) throw error;
    if (!data) {
      const username = (authUser.user_metadata?.username || `user_${authUser.id.slice(0, 8)}`).toLowerCase();
      const display_name = authUser.user_metadata?.display_name || username;
      const { data: made, error: madeError } = await supabase.from("profiles")
        .insert({ id: authUser.id, username, display_name, status: "Online", staff_badges: [] })
        .select().single();
      if (madeError) throw madeError;
      data = made;
    } else {
      await supabase.from("profiles").update({ status: "Online" }).eq("id", authUser.id);
      data = { ...data, status: "Online" };
    }
    setMe(data);
  }

  async function loadAll() {
    if (!session?.user) return;
    const [{ data: ps }, { data: ss }] = await Promise.all([
      supabase.from("profiles").select("*").order("display_name"),
      supabase.from("servers").select("*").order("created_at")
    ]);
    setProfiles(ps || []);
    const membershipsResult = await supabase.from("server_members").select("server_id").eq("user_id", session.user.id);
    const memberships = membershipsResult.data || [];
    const allowed = new Set(memberships.map(x => x.server_id));
    const visibleServers = (ss || []).filter(s => allowed.has(s.id) || s.owner_id === session.user.id);
    setServers(visibleServers);

    // Preload every visible server channel's messages so users do not have to
    // click into a channel first just to refresh/load its chat.
    const visibleServerIds = visibleServers.map(s => s.id);
    if (visibleServerIds.length) {
      const { data: allChannels } = await supabase
        .from("channels")
        .select("id,server_id")
        .in("server_id", visibleServerIds);
      const channelIds = (allChannels || []).map(c => c.id);
      if (channelIds.length) {
        const { data: allServerMessages } = await supabase
          .from("server_messages")
          .select("*")
          .in("channel_id", channelIds)
          .order("created_at");
        const grouped = {};
        (allServerMessages || []).forEach(m => {
          (grouped[m.channel_id] ||= []).push(m);
        });
        setServerMessagesByChannel(grouped);
        if (channelId && grouped[channelId]) setMessages(grouped[channelId]);
      } else {
        setServerMessagesByChannel({});
      }
    } else {
      setServerMessagesByChannel({});
    }

    // Preload all DM conversations the signed-in user belongs to.
    const { data: myDmMembers } = await supabase
      .from("dm_members")
      .select("conversation_id")
      .eq("user_id", session.user.id);
    const conversationIds = (myDmMembers || []).map(x => x.conversation_id);
    if (conversationIds.length) {
      const { data: allDmMessages } = await supabase
        .from("dm_messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at");
      const groupedDms = {};
      (allDmMessages || []).forEach(m => {
        (groupedDms[m.conversation_id] ||= []).push(m);
      });
      setDmMessagesByConversation(groupedDms);
      if (dmConversationId && groupedDms[dmConversationId]) setDmMessages(groupedDms[dmConversationId]);
    } else {
      setDmMessagesByConversation({});
    }
  }

  async function openServer(id) {
    setPage("server"); setServerId(id); setChannelId(null); setDmUserId(null);
    const [{ data: cs }, { data: mem }, { data: rs }, { data: rms }] = await Promise.all([
      supabase.from("channels").select("*").eq("server_id", id).order("created_at"),
      supabase.from("server_members").select("user_id").eq("server_id", id),
      supabase.from("server_roles").select("*").eq("server_id", id).order("position", { ascending: false }),
      supabase.from("server_role_members").select("role_id,user_id")
    ]);
    setChannels(cs || []);
    const memberIds = (mem || []).map(x => x.user_id);
    setServerMembers(memberIds);
    setServerRoles(rs || []);
    setServerRoleMembers((rms || []).filter(x => memberIds.includes(x.user_id)));
    const first = (cs || []).find(c => c.type === "text");
    if (first) openChannel(first.id);
  }

  async function openChannel(id) {
    setPage("server"); setChannelId(id); setVoiceOpen(false);
    setUnreadServerChannels(prev => {
  const next = { ...prev };
  delete next[id];
  return next;
});
    const cached = serverMessagesByChannel[id];
    if (cached) {
      setMessages(cached);
      return;
    }
    const { data } = await supabase.from("server_messages").select("*").eq("channel_id", id).order("created_at");
    const next = data || [];
    setMessages(next);
    setServerMessagesByChannel(prev => ({ ...prev, [id]: next }));
  }

  async function openDm(user) {
    setPage("home"); setDmUserId(user.id); setServerId(null); setChannelId(null);
    const { data: mine } = await supabase.from("dm_members").select("conversation_id").eq("user_id", session.user.id);
    const ids = (mine || []).map(x => x.conversation_id);
    let conversation = null;
    if (ids.length) {
      const { data: other } = await supabase.from("dm_members").select("conversation_id").eq("user_id", user.id).in("conversation_id", ids);
      if (other?.[0]) conversation = other[0].conversation_id;
    }
    if (!conversation) {
      const { data: created, error } = await supabase.from("dm_conversations").insert({ created_by: session.user.id }).select().single();
      if (error) { notify(error.message); return; }
      conversation = created.id;
      const { error: memberError } = await supabase.from("dm_members").insert([
        { conversation_id: conversation, user_id: session.user.id },
        { conversation_id: conversation, user_id: user.id }
      ]);
      if (memberError) { notify(memberError.message); return; }
    }
    setDmConversationId(conversation);
    setDmConversationByUser(prev => ({
  ...prev,
  [user.id]: conversation
}));
    setUnreadDmConversations(prev => {
  const next = { ...prev };
  delete next[conversation];
  return next;
});
    const cached = dmMessagesByConversation[conversation];
    if (cached) {
      setDmMessages(cached);
    } else {
      const { data: msgs } = await supabase.from("dm_messages").select("*").eq("conversation_id", conversation).order("created_at");
      const next = msgs || [];
      setDmMessages(next);
      setDmMessagesByConversation(prev => ({ ...prev, [conversation]: next }));
    }
  }

  async function send() {
    if (!text.trim()) return;
    if (page === "server" && channelId) {
      if (!canSendToChannel(selectedChannel)) {
        notify(selectedChannel?.is_locked ? "This channel is locked for your role." : "You do not have permission to send messages in this server.");
        return;
      }
      const { error } = await supabase.from("server_messages").insert({ channel_id: channelId, user_id: me.id, content: text.trim() });
      if (error) notify(error.message);
    } else if (page === "home" && dmConversationId) {
      const { error } = await supabase.from("dm_messages").insert({ conversation_id: dmConversationId, user_id: me.id, content: text.trim() });
      if (error) notify(error.message);
    }
    setText("");
  }

  async function updateMe(patch) {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", me.id).select().single();
    if (error) { notify(error.message); return; }
    setMe(data);
    setProfiles(p => p.map(x => x.id === data.id ? data : x));
  }

  async function uploadAvatar(file) {
    if (!file || !me?.id) return;
    if (!file.type.startsWith("image/")) return notify("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return notify("Profile pictures must be 5 MB or smaller.");
    setUploadingAvatar(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `avatars/${me.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("vexel-media").upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("vexel-media").getPublicUrl(path);
      await updateMe({ avatar_url: publicData.publicUrl });
      setProfileOpen(p => p ? { ...p, avatar_url: publicData.publicUrl } : p);
      notify("Profile picture updated.");
    } catch (e) {
      notify(e.message || "Profile picture upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function uploadServerMedia(file, kind) {
    if (!file || !selectedServer?.id) return;
    if (!file.type.startsWith("image/")) return notify("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return notify("Images must be 5 MB or smaller.");
    if (!hasServerPermission("manage_server")) return notify("You do not have permission to change this server.");
    setUploadingServerMedia(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `servers/${selectedServer.id}/${kind}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("vexel-media").upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("vexel-media").getPublicUrl(path);
      const field = kind === "icon" ? "icon_url" : "banner_url";
      const { data, error } = await supabase.from("servers").update({ [field]: publicData.publicUrl }).eq("id", selectedServer.id).select().single();
      if (error) throw error;
      setServers(list => list.map(s => s.id === data.id ? data : s));
      notify(`${kind === "icon" ? "Server icon" : "Server banner"} updated.`);
    } catch (e) {
      notify(e.message || "Server image upload failed.");
    } finally {
      setUploadingServerMedia(false);
    }
  }

  async function joinServerByCode(rawCode) {
    const code = String(rawCode || '').trim();
    if (!code) return;
    const { data: server, error } = await supabase.from("servers").select("*").eq("invite_code", code).maybeSingle();
    if (error) return notify(error.message);
    if (!server) return notify("That server code was not found.");
    const { error: memberError } = await supabase.from("server_members").upsert({ server_id: server.id, user_id: me.id }, { onConflict: "server_id,user_id", ignoreDuplicates: true });
    if (memberError) return notify(memberError.message);
    await loadAll();
    notify(`Joined ${server.name}.`);
    openServer(server.id);
  }

  async function createServer() {
    const name = prompt("Server name");
    if (!name?.trim()) return;
    const description = prompt("Server description", "") || "";
    const { data, error } = await supabase.from("servers").insert({
      name: name.trim(),
      description: description.trim(),
      owner_id: me.id,
      invite_code: uid().slice(0, 8)
    }).select().single();
    if (error) return notify(error.message);
    const { error: memberError } = await supabase.from("server_members").insert({ server_id: data.id, user_id: me.id });
    if (memberError) notify(memberError.message);
    await supabase.from("server_roles").insert({ server_id: data.id, name: "Member", color: "#5b8cff", permissions: DEFAULT_SERVER_PERMISSIONS, position: 1 });
    await loadAll();
    openServer(data.id);
  }

  async function createChannel() {
    if (!serverId || !hasServerPermission("manage_channels")) return notify("You do not have permission to create channels.");
    const name = prompt("Channel name");
    if (!name?.trim()) return;
    const type = (prompt("Type: text or voice", "text") || "text").toLowerCase() === "voice" ? "voice" : "text";
    const { error } = await supabase.from("channels").insert({
      server_id: serverId,
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      type
    });
    if (error) return notify(error.message);
    await openServer(serverId);
  }


  async function saveChannelAccess(channel, locked, allowedRoleIds) {
    if (!hasServerPermission("manage_channels")) return notify("You do not have permission to manage channels.");
    const safeRoleIds = Array.from(new Set((allowedRoleIds || []).filter(id => serverRoles.some(r => r.id === id))));
    const { data, error } = await supabase.from("channels")
      .update({ is_locked: !!locked, allowed_role_ids: safeRoleIds })
      .eq("id", channel.id)
      .select()
      .single();
    if (error) return notify(error.message);
    setChannels(list => list.map(c => c.id === data.id ? data : c));
    notify(locked ? `#${data.name} is now locked.` : `#${data.name} is now unlocked.`);
  }

  async function renameChannel(channel) {
    if (!hasServerPermission("manage_channels")) return notify("You do not have permission to rename channels.");
    const name = prompt("New channel name", channel.name);
    if (!name?.trim()) return;
    const { error } = await supabase.from("channels").update({ name: name.trim().toLowerCase().replace(/\s+/g, "-") }).eq("id", channel.id);
    if (error) notify(error.message); else openServer(serverId);
  }

  async function deleteChannel(channel) {
    if (!hasServerPermission("manage_channels")) return notify("You do not have permission to delete channels.");
    if (!confirm(`Delete #${channel.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("channels").delete().eq("id", channel.id);
    if (error) notify(error.message); else {
      setChannelId(null);
      await openServer(serverId);
    }
  }

  async function saveServerSettings() {
    if (!selectedServer || !hasServerPermission("manage_server")) return notify("You do not have permission to manage this server.");
    const { data, error } = await supabase.from("servers").update({
      name: serverDraft.name.trim() || selectedServer.name,
      description: serverDraft.description.trim()
    }).eq("id", selectedServer.id).select().single();
    if (error) return notify(error.message);
    setServers(list => list.map(s => s.id === data.id ? data : s));
    notify("Server settings saved.");
  }

  async function setStaffBadge(user, badge, enabled) {
    if (!canManageStaff) return notify("Only the Owner can manage official Vexel staff badges.");
    const current = Array.isArray(user.staff_badges) ? user.staff_badges : [];
    const next = enabled ? Array.from(new Set([...current, badge])) : current.filter(x => x !== badge);
    const { data, error } = await supabase.from("profiles").update({ staff_badges: next }).eq("id", user.id).select().single();
    if (error) return notify(error.message);
    setProfiles(list => list.map(p => p.id === user.id ? data : p));
    if (user.id === me.id) setMe(data);
    notify(`${STAFF[badge]?.name || badge} badge ${enabled ? "assigned" : "removed"} for @${user.username}.`);
  }

  async function removeServer(server) {
    if (server.owner_id !== me.id) return notify("Only the server owner can delete a server.");
    if (!confirm(`Delete ${server.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("servers").delete().eq("id", server.id);
    if (error) return notify(error.message);
    setServerId(null); setChannelId(null); setPage("home");
    await loadAll();
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ensureMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) { meta = document.createElement("meta"); meta.name = name; document.head.appendChild(meta); }
      meta.content = content;
    };
    let manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) { manifest = document.createElement("link"); manifest.rel = "manifest"; document.head.appendChild(manifest); }
    manifest.href = "/manifest.webmanifest";
    ensureMeta("theme-color", "#315ecf");
    ensureMeta("apple-mobile-web-app-capable", "yes");
    ensureMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    ensureMeta("apple-mobile-web-app-title", "Vexel");
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) { appleIcon = document.createElement("link"); appleIcon.rel = "apple-touch-icon"; document.head.appendChild(appleIcon); }
    appleIcon.href = "/icons/icon-192.png";
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(err => console.warn("Vexel service worker registration failed:", err));
    }
    const onInstallPrompt = e => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installVexel() {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch (err) {
      console.warn("Vexel install prompt failed:", err);
    } finally {
      setInstallPrompt(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await refreshProfile(data.session.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) await refreshProfile(s.user);
      else setMe(null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user || !me) return;
    loadAll();
    const presence = supabase.channel("global-presence");
    presence.on("presence", { event: "sync" }, () => {}).subscribe(async status => {
      if (status === "SUBSCRIBED") await presence.track({ user_id: me.id, online_at: new Date().toISOString() });
    });
    const changes = supabase.channel("vexel-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "server_messages" }, p => {
        if (p.eventType === "INSERT") {
          setServerMessagesByChannel(prev => {
            const current = prev[p.new.channel_id] || [];
            if (current.some(x => x.id === p.new.id)) return prev;
            return { ...prev, [p.new.channel_id]: [...current, p.new] };
          });
          if (p.new.channel_id === channelId) {
            setMessages(m => m.some(x => x.id === p.new.id) ? m : [...m, p.new]);
          }
          if (p.new.user_id !== me.id) notify("New server message");
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages" }, p => {
        if (p.eventType === "INSERT") {
          setDmMessagesByConversation(prev => {
            const current = prev[p.new.conversation_id] || [];
            if (current.some(x => x.id === p.new.id)) return prev;
            return { ...prev, [p.new.conversation_id]: [...current, p.new] };
          });
          if (p.new.conversation_id === dmConversationId) {
            setDmMessages(m => m.some(x => x.id === p.new.id) ? m : [...m, p.new]);
          }
          if (p.new.user_id !== me.id) notify("New private message");
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, p => {
        if (p.eventType === "INSERT") setProfiles(a => [...a.filter(x => x.id !== p.new.id), p.new]);
        if (p.eventType === "UPDATE") {
          setProfiles(a => a.map(x => x.id === p.new.id ? p.new : x));
          if (p.new.id === me.id) setMe(p.new);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(presence); supabase.removeChannel(changes); };
  }, [session?.user?.id, me?.id, dmConversationId, channelId]);

  useEffect(() => {
    if (!me?.id) return;
    const invite = supabase.channel(`call-invite:${me.id}`);
    invite.on("broadcast", { event: "incoming-call" }, ({ payload }) => {
      if (!payload || payload.callerId === me.id) return;
      const caller = profiles.find(p => p.id === payload.callerId);
      setIncomingCall({ ...payload, caller: caller || { id: payload.callerId, display_name: payload.callerName || "Vexel user" } });
    }).subscribe();
    return () => { supabase.removeChannel(invite); };
  }, [me?.id, profiles]);

  useEffect(() => {
    if (!me) return;
    const timer = setInterval(() => supabase.from("user_presence").upsert({ user_id: me.id, online: true, updated_at: new Date().toISOString() }), 30000);
    supabase.from("user_presence").upsert({ user_id: me.id, online: true, updated_at: new Date().toISOString() });
    return () => clearInterval(timer);
  }, [me?.id]);

  useEffect(() => {
    if (selectedServer) setServerDraft({ name: selectedServer.name || "", description: selectedServer.description || "" });
  }, [selectedServer?.id, selectedServer?.name, selectedServer?.description]);

  if (loading) return <div className="loading">Loading Vexel...</div>;
  if (!session || !me) return <Auth onDone={() => {}} />;

  const visibleProfiles = profiles.filter(p => p.id !== me.id);
  const serverChannels = channels.filter(c => c.server_id === serverId);

  const adminStyles = `
    .admin-panel{position:fixed;inset:0;background:rgba(4,8,14,.82);backdrop-filter:blur(8px);z-index:60;display:flex;justify-content:center;align-items:center;padding:18px}
    .admin-window{width:min(1100px,96vw);height:min(760px,92vh);background:#111b29;border:1px solid #334865;border-radius:20px;display:flex;overflow:hidden;box-shadow:0 30px 100px #000b}
    .admin-nav{width:220px;min-width:220px;background:#0c1420;border-right:1px solid #263850;padding:16px;display:flex;flex-direction:column;gap:7px}
    .admin-nav button{background:transparent;text-align:left;padding:12px;border-radius:10px;color:#a9b8cc}
    .admin-nav button.active,.admin-nav button:hover{background:#1d2d46;color:#fff}
    .admin-content{flex:1;min-width:0;overflow:auto;padding:24px}
    .admin-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}
    .admin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
    .admin-card{background:#182438;border:1px solid #2b3d58;border-radius:14px;padding:16px}
    .admin-card b{font-size:25px;display:block;margin-top:5px}
    .admin-card span,.admin-muted{color:#8190a7;font-size:12px}
    .admin-list{display:grid;gap:8px}
    .admin-row{display:flex;align-items:center;gap:10px;padding:11px;background:#172337;border:1px solid #283b57;border-radius:11px}
    .admin-row .grow{flex:1;min-width:0}
    .admin-row small{display:block;color:#8190a7}
    .admin-actions{display:flex;gap:6px;flex-wrap:wrap}
    .admin-actions button{background:#263852;border-radius:8px;padding:8px 10px}
    .admin-actions button.active{background:#315ecf}
    .admin-section{margin-bottom:24px}
    .admin-section h3{margin:0 0 10px}
    .admin-form{display:grid;gap:9px}
    .admin-form textarea{min-height:100px}
    .server-media{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .media-card{background:#182438;border:1px solid #2b3d58;border-radius:14px;padding:12px}
    .media-preview{width:100%;height:130px;object-fit:cover;border-radius:10px;background:#0b111b;border:1px solid #2a3a53}
    .banner-preview{height:170px}
    .profile-avatar-wrap{position:relative;width:52px;height:52px}
    .profile-avatar-wrap .avatar{width:52px;height:52px}
    .avatar-edit-btn{position:absolute;right:-7px;bottom:-7px;width:30px;height:30px;border-radius:50%;background:#315ecf;border:2px solid #151f2e}
    .channel-line{display:flex;align-items:center;width:100%}.channel-line .channel{flex:1}.channel-actions{display:flex;gap:2px;padding-right:6px}.channel-actions button{background:transparent;padding:5px;border-radius:6px}.channel-actions button:hover{background:#263852}.header-server-banner{height:44px;max-width:220px;object-fit:cover;border-radius:8px;border:1px solid #2c3e59}.upload-hint{padding:10px;border-radius:10px;background:#182a43;color:#9eb5d7;font-size:12px;margin-bottom:4px}
    .admin-warning{padding:12px;border-radius:10px;background:#3a2a1b;color:#ffd39b;font-size:12px;margin-bottom:12px}
    .role-modal{width:min(900px,96vw)}.role-layout{display:grid;grid-template-columns:220px 1fr;gap:18px}.role-list,.role-editor{background:#111b29;border:1px solid #2b3d58;border-radius:14px;padding:14px}.role-list{display:flex;flex-direction:column;gap:7px}.role-item{display:flex;align-items:center;gap:8px;background:transparent;padding:10px;border-radius:9px;text-align:left}.role-item.selected,.role-item:hover{background:#22304a}.role-dot{width:10px;height:10px;border-radius:50%;flex:none}.role-create{display:grid;gap:7px;margin-top:8px}.role-editor{display:grid;gap:9px}.role-editor h3{margin:8px 0 2px}.permission-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.permission-row{display:flex;align-items:center;gap:8px;background:#172337;border:1px solid #283b57;border-radius:9px;padding:9px;color:#d9e4f5}.permission-row input{width:auto}.role-editor input[type=color]{height:42px;padding:4px}.role-editor .active{background:#315ecf}.role-editor .danger{justify-self:start}
    .vexel-hub{padding:34px;max-width:1000px;margin:0 auto;display:grid;gap:22px}.hub-hero{display:flex;align-items:center;gap:18px;padding:24px;border:1px solid #2b3d58;border-radius:22px;background:linear-gradient(135deg,#142239,#0f1827);box-shadow:0 20px 60px #0005}.hub-mark{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;background:#315ecf;color:#fff;font-size:30px;font-weight:900;flex:none}.hub-copy{min-width:0;flex:1}.hub-kicker{font-size:11px;font-weight:900;letter-spacing:.14em;color:#7890b1}.hub-copy h1{margin:5px 0 6px;font-size:clamp(22px,4vw,34px)}.hub-copy p{margin:0;color:#9aabc1}.hub-actions{display:flex;gap:8px;flex-wrap:wrap}.hub-actions button,.hub-card{border:1px solid #30445f;background:#1a2a42;color:#eaf1fb;border-radius:12px;padding:11px 13px;font-weight:800}.hub-actions button:hover,.hub-card:hover{background:#223752}.hub-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.hub-card{text-align:left;display:flex;align-items:center;gap:12px;min-height:88px}.hub-card small{display:block;color:#8799b1;font-weight:500;margin-top:4px}.hub-icon{width:38px;height:38px;border-radius:11px;background:#0e1827;display:grid;place-items:center;font-size:20px;flex:none}.hub-section{padding:20px;border:1px solid #293c57;border-radius:18px;background:#121d2d}.hub-section-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:14px}.hub-section-head h2{margin:3px 0 0}.hub-section-head>span{font-size:12px;color:#8294ad}.hub-space-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.hub-space{display:flex;gap:10px;align-items:center;padding:11px;border-radius:12px;background:#17263a}.hub-space-icon{width:42px;height:42px;border-radius:12px;background:#253a57;display:grid;place-items:center;font-weight:900;overflow:hidden}.hub-space-icon img{width:100%;height:100%;object-fit:cover}.hub-space b{display:block}.hub-space small{display:block;color:#8193ab;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px}.hub-empty{padding:18px;border:1px dashed #38506d;border-radius:12px;color:#9aacbf}.hub-empty b{color:#dce7f8}@media(max-width:800px){.hub-hero{align-items:flex-start;flex-wrap:wrap}.hub-actions{width:100%}.hub-grid{grid-template-columns:1fr}.hub-space-list{grid-template-columns:1fr}.vexel-hub{padding:20px 14px}}
    .install-modal{width:min(640px,96vw)}.install-platforms{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.install-platforms button{background:#172337;border:1px solid #2b3d58;border-radius:10px;padding:10px 12px;color:#dce7f8}.install-platforms button.active{background:#315ecf;color:#fff}.install-guide{background:#172337;border:1px solid #2b3d58;border-radius:14px;padding:16px}.install-guide h3{margin-top:0}.install-guide ol{margin:0;padding-left:22px;color:#aebdd0}.install-guide li{margin:8px 0}.install-now{width:100%;margin-top:12px}
    @media(max-width:700px){.admin-window{height:94vh;width:98vw}.admin-nav{width:150px;min-width:150px}.admin-content{padding:16px}.server-media{grid-template-columns:1fr}}
  `;

  return <div className="app">
    <style>{adminStyles}</style>
    <aside className="rail">
      <button className="mobile-menu-btn" onClick={() => setMobileMenu(v => !v)} aria-label="Open navigation">☰</button>
      <button className={page === "home" ? "rail-btn active" : "rail-btn"} onClick={() => { setPage("home"); setVoiceOpen(false); setServerId(null); setChannelId(null); setMobileMenu(false); }}>V</button>
      <div className="divider" />
      {servers.map(s => <button key={s.id} className={serverId === s.id ? "rail-btn active" : "rail-btn"} title={s.name} onClick={() => { openServer(s.id); setMobileMenu(false); }}>{s.icon_url ? <img src={s.icon_url} alt="" /> : s.name.slice(0, 1).toUpperCase()}</button>)}
      <button className="rail-btn add" onClick={createServer}>+</button>
      <div className="spacer" />
      {canUseAdminPanel && <button className="rail-btn" title="Vexel Admin Panel" onClick={() => setAdminOpen(true)}>🛡️</button>}
      <button className="rail-btn" onClick={() => setProfileOpen(me)}>👤</button>
      <button className="rail-btn" onClick={() => supabase.auth.signOut()}>↪</button>
    </aside>

    <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
      <div className="side-head"><div><small>VEXEL</small><h3>{page === "home" ? "Home" : selectedServer?.name || "Server"}</h3></div>
        {page === "home" && <button onClick={() => setAddOpen(true)}>＋</button>}
      </div>

      {page === "home" ? <>
        <div className="side-section">DIRECT MESSAGES</div>
        {visibleProfiles.map(u => <button className={dmUserId === u.id ? "user-row selected" : "user-row"} key={u.id} onClick={() => openDm(u)}>
          <Avatar user={u} small /><span><b>{u.display_name}</b><small>@{u.username}</small></span><i className={u.status === "Online" ? "online" : ""} />
          {unreadDmConversations[dmConversationByUser[u.id]] > 0 && (
  <strong className="unread-badge">
    {unreadDmConversations[dmConversationByUser[u.id]]}
  </strong>
)}
        </button>)}
        {!visibleProfiles.length && <p className="muted">Use ＋ to add/search people.</p>}
      </> : <>
        <div className="server-about">{selectedServer?.description || "Server"}</div>
        <div className="side-section">TEXT CHANNELS</div>
        {serverChannels.filter(c => c.type === "text").map(c => <div className="channel-line" key={c.id}>
          <button className={channelId === c.id ? "channel selected" : "channel"} onClick={() => openChannel(c.id)}># {c.name}{c.is_locked ? " 🔒" : ""}</button>
          {hasServerPermission("manage_channels") && <span className="channel-actions">
            <button title={c.is_locked ? "Unlock channel" : "Lock channel"} onClick={() => setChannelAccessOpen(c)}>🔒</button>
            <button title="Rename" onClick={() => renameChannel(c)}>✏️</button>
            <button title="Delete" onClick={() => deleteChannel(c)}>🗑️</button>
          </span>}
        </div>)}
        <div className="side-section">VOICE CHANNELS</div>
        {serverChannels.filter(c => c.type === "voice").map(c => <div className="channel-line" key={c.id}>
          <button className={channelId === c.id ? "channel selected" : "channel"} onClick={() => { setChannelId(c.id); setVoiceOpen(true); setMobileMenu(false); }}>🔊 {c.name}</button>
          {hasServerPermission("manage_channels") && <span className="channel-actions">
            <button title="Rename" onClick={() => renameChannel(c)}>✏️</button>
            <button title="Delete" onClick={() => deleteChannel(c)}>🗑️</button>
          </span>}
        </div>)}
        {hasServerPermission("manage_channels") && <button className="side-add" onClick={createChannel}>＋ Add Channel</button>}
        {hasServerPermission("manage_roles") && <button className="side-add" onClick={() => setRolesOpen(true)}>🏷️ Manage Roles</button>}
        {hasServerPermission("manage_server") && <button className="side-add" onClick={() => { setAdminTab("server"); setAdminOpen(true); }}>⚙️ Manage Server</button>}
      </>}

      {page === "home" && <><button className="side-add" onClick={() => setAddOpen(true)}>＋ Add People</button><button className="side-add" onClick={() => setInstallOpen(true)}>📦 Install Vexel</button></>}
    </aside>
    {mobileMenu && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

    {page === "server" && selectedChannel && voiceOpen && selectedChannel.type === "voice" ? <Voice channel={selectedChannel} me={me} profiles={profiles} onLeave={() => setVoiceOpen(false)} /> :
      <main className="main">
        {page === "home" && dmUserId ? <>
          <header className="header"><div className="header-user" onClick={() => setProfileOpen(selectedDmUser)}><Avatar user={selectedDmUser} small /><div className="header-user-text"><b>{selectedDmUser?.display_name}</b><span>@{selectedDmUser?.username}</span><StaffBadgesUnderName user={selectedDmUser} onBadgeClick={() => {}} /></div></div><button onClick={() => startPrivateCall(selectedDmUser)}>📞 Call</button></header>
          <MessageList messages={dmMessages} profiles={profiles} />
          <Composer text={text} setText={setText} send={send} />
          {voiceOpen && selectedDmUser && dmConversationId && <PrivateCall user={selectedDmUser} me={me} conversationId={dmConversationId} onClose={() => setVoiceOpen(false)} />}
        </> : page === "server" && selectedChannel ? <>
          <header className="header">
            <div><b># {selectedChannel.name}</b><span>Server channel</span></div>
            {selectedServer?.banner_url && <img className="header-server-banner" src={selectedServer.banner_url} alt="" />}
          </header>
          <MessageList messages={messages} profiles={profiles} />
          <Composer text={text} setText={setText} send={send} disabled={!canSendToChannel(selectedChannel)} placeholder={selectedChannel?.is_locked ? "Channel is locked for your role" : "Write a message..."} />
</> : <VexelHomeHub me={me} servers={servers} visibleProfiles={visibleProfiles} onAddPeople={() => setAddOpen(true)} onCreateServer={createServer} onJoinServer={() => { const code = prompt("Enter the server invite code"); if (code) joinServerByCode(code); }} onOpenProfile={() => setProfileOpen(me)} onInstall={() => setInstallOpen(true)} onMiniGames={() => setMiniGame("menu")} />}
      </main>
    }

{installOpen && <InstallVexelModal canInstall={!!installPrompt} onInstall={installVexel} onClose={() => setInstallOpen(false)} />}
  {miniGame && <MiniGamesModal game={miniGame} onClose={(nextGame) => setMiniGame(nextGame || null)} />}
    {profileOpen && <ProfileModal user={profileOpen} isSelf={profileOpen.id === me.id} onClose={() => setProfileOpen(null)} onSave={updateMe} onUploadAvatar={uploadAvatar} uploadingAvatar={uploadingAvatar} />}
    {rolesOpen && selectedServer && <ServerRolesModal server={selectedServer} members={serverMembers} profiles={profiles} roles={serverRoles} roleMembers={serverRoleMembers} canManage={hasServerPermission("manage_roles")} onClose={() => setRolesOpen(false)} onCreateRole={createServerRole} onUpdateRole={updateServerRole} onDeleteRole={deleteServerRole} onAssignRole={assignServerRole} onRemoveRole={removeServerRole} />}
    {channelAccessOpen && selectedServer && <ChannelAccessModal channel={channelAccessOpen} roles={serverRoles} onSave={saveChannelAccess} onClose={() => setChannelAccessOpen(null)} />}
    {addOpen && <AddPeople users={visibleProfiles} onClose={() => setAddOpen(false)} onPick={u => { setAddOpen(false); openDm(u); }} />}
    {notice && <div className="toast">🔔 {notice}</div>}
    {incomingCall && <div className="modal-bg" style={{zIndex:80}}>
      <div className="modal call-incoming">
        <div className="profile-top">
          <Avatar user={incomingCall.caller} />
          <div><h2 style={{margin:0}}>Incoming Vexel call</h2><p style={{margin:"5px 0 0",color:"#8d9ab0"}}>{incomingCall.caller?.display_name || "Someone"} is calling you.</p></div>
        </div>
        <div className="controls">
          <button className="primary" onClick={() => {
            const caller = incomingCall.caller;
            setDmUserId(caller.id); setDmConversationId(incomingCall.conversationId); setPage("home"); setServerId(null); setChannelId(null); setIncomingCall(null); setVoiceOpen(true);
          }}>📞 Accept</button>
          <button className="danger" onClick={() => setIncomingCall(null)}>✕ Decline</button>
        </div>
      </div>
    </div>}

    {adminOpen && canUseAdminPanel && <div className="admin-panel">
      <div className="admin-window">
        <nav className="admin-nav">
          <button className={adminTab === "overview" ? "active" : ""} onClick={() => setAdminTab("overview")}>👑 Staff Overview</button>
          <button className={adminTab === "users" ? "active" : ""} onClick={() => setAdminTab("users")}>👤 User Management</button>
          {canManageStaff && <button className={adminTab === "staff" ? "active" : ""} onClick={() => setAdminTab("staff")}>🏷️ Staff Badges</button>}
          <button className={adminTab === "moderation" ? "active" : ""} onClick={() => setAdminTab("moderation")}>🔨 Moderation</button>
          <button className={adminTab === "server" ? "active" : ""} onClick={() => setAdminTab("server")}>🏠 Server Management</button>
          <button className={adminTab === "channels" ? "active" : ""} onClick={() => setAdminTab("channels")}>📁 Channel Management</button>
          <button className="danger" onClick={() => setAdminOpen(false)}>Close</button>
        </nav>

        <section className="admin-content">
          <div className="admin-top"><div><small>VEXEL ADMINISTRATION</small><h2 style={{margin:"3px 0"}}>{adminTab === "overview" ? "Staff Overview" : adminTab === "users" ? "User Management" : adminTab === "staff" ? "Official Staff Badges" : adminTab === "moderation" ? "Moderation Tools" : adminTab === "server" ? "Server Management" : "Channel Management"}</h2></div></div>

          {adminTab === "overview" && <div className="admin-section">
            <div className="admin-grid">
              <div className="admin-card"><span>Users</span><b>{profiles.length}</b></div>
              <div className="admin-card"><span>Servers you can access</span><b>{servers.length}</b></div>
              <div className="admin-card"><span>Channels loaded</span><b>{channels.length}</b></div>
              <div className="admin-card"><span>Staff accounts</span><b>{profiles.filter(p => (p.staff_badges || []).length).length}</b></div>
            </div>
            <div className="admin-card" style={{marginTop:12}}>
              <h3>🔐 Your permissions</h3>
              <div className="badges">{staffBadges.length ? staffBadges.map(b => <StaffBadge key={b} badge={b} />) : <span className="admin-muted">No official Vexel staff badge</span>}</div>
              <p className="admin-muted">Only the official Owner can assign or remove Vexel staff badges.</p>
            </div>
          </div>}

          {adminTab === "users" && <div className="admin-section">
            <div className="admin-list">
              {profiles.map(user => <div className="admin-row" key={user.id}>
                <Avatar user={user} small />
                <div className="grow"><b>{user.display_name}</b><small>@{user.username} · {user.status || "Offline"}</small></div>
                <div className="badges">{(user.staff_badges || []).map(b => <StaffBadge key={b} badge={b} />)}</div>
                <button onClick={() => setProfileOpen(user)}>View</button>
              </div>)}
            </div>
          </div>}

          {adminTab === "staff" && canManageStaff && <div className="admin-section">
            <div className="admin-warning">Only the official Owner can assign or remove these badges.</div>
            <div className="admin-list">
              {profiles.map(user => <div className="admin-row" key={user.id}>
                <Avatar user={user} small />
                <div className="grow"><b>{user.display_name}</b><small>@{user.username}</small></div>
                <div className="admin-actions">
                  {Object.entries(STAFF).map(([key, info]) => {
                    const checked = (user.staff_badges || []).includes(key);
                    return <button key={key} className={checked ? "active" : ""} onClick={() => setStaffBadge(user, key, !checked)}>{info.icon} {info.name}</button>;
                  })}
                </div>
              </div>)}
            </div>
          </div>}

          {adminTab === "moderation" && <div className="admin-section">
            <div className="admin-card">
              <h3>🔨 Moderation tools</h3>
              <p className="admin-muted">Open a user's profile to review their public profile and staff verification badges. Destructive moderation actions should be enforced by database policies before they are enabled here.</p>
              <div className="admin-list">
                {profiles.filter(p => p.id !== me.id).slice(0, 25).map(user => <div className="admin-row" key={user.id}>
                  <Avatar user={user} small /><div className="grow"><b>{user.display_name}</b><small>@{user.username}</small></div>
                  <button onClick={() => setProfileOpen(user)}>Review User</button>
                </div>)}
              </div>
            </div>
          </div>}

          {adminTab === "server" && <div className="admin-section">
            {!selectedServer ? <div className="admin-card">Select a server first.</div> : <>
              <div className="admin-form">
                <label>Server name</label><input value={serverDraft.name} onChange={e => setServerDraft(d => ({...d, name:e.target.value}))} />
                <label>Description</label><textarea value={serverDraft.description} onChange={e => setServerDraft(d => ({...d, description:e.target.value}))} />
               
               <div className="admin-card" style={{marginTop:14}}>
  <h3>🔗 Server Invite Code</h3>
  <p className="admin-muted">
    Give this code to people you want to invite to your server.
  </p>

  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
    <input
      value={selectedServer.invite_code || ""}
      readOnly
      style={{flex:1,minWidth:180}}
    />

    <button
      className="primary"
      onClick={() => {
        if (selectedServer.invite_code) {
          navigator.clipboard?.writeText(selectedServer.invite_code);
          notify("Server invite code copied!");
        }
      }}
      disabled={!selectedServer.invite_code}
    >
      📋 Copy Code
    </button>
  </div>
</div>
 <button className="primary" onClick={saveServerSettings}>Save Server Settings</button>
              </div>
              <div className="server-media" style={{marginTop:14}}>
                <div className="media-card">
                  <b>🏠 Server Icon</b>
                  {selectedServer.icon_url ? <img className="media-preview" src={selectedServer.icon_url} alt="Server icon" /> : <div className="media-preview" />}
                  <button className="primary" style={{marginTop:8,width:"100%"}} onClick={() => serverIconRef.current?.click()} disabled={uploadingServerMedia}>Choose Icon</button>
                  <input ref={serverIconRef} type="file" accept="image/*" hidden onChange={e => { const f=e.target.files?.[0]; e.target.value=""; if(f) uploadServerMedia(f,"icon"); }} />
                </div>
                <div className="media-card">
                  <b>🖼️ Server Banner</b>
                  {selectedServer.banner_url ? <img className="media-preview banner-preview" src={selectedServer.banner_url} alt="Server banner" /> : <div className="media-preview banner-preview" />}
                  <button className="primary" style={{marginTop:8,width:"100%"}} onClick={() => serverBannerRef.current?.click()} disabled={uploadingServerMedia}>Choose Banner</button>
                  <input ref={serverBannerRef} type="file" accept="image/*" hidden onChange={e => { const f=e.target.files?.[0]; e.target.value=""; if(f) uploadServerMedia(f,"banner"); }} />
                </div>
              </div>
              <button className="danger" style={{marginTop:16}} onClick={() => removeServer(selectedServer)}>Delete Server</button>
            </>}
          </div>}

          {adminTab === "channels" && <div className="admin-section">
            {!selectedServer ? <div className="admin-card">Select a server first.</div> : <>
              <button className="primary" onClick={createChannel}>＋ Create Channel</button>
              <div className="admin-list" style={{marginTop:12}}>
                {serverChannels.map(channel => <div className="admin-row" key={channel.id}>
                  <div className="grow"><b>{channel.type === "voice" ? "🔊" : "#"} {channel.name}</b><small>{channel.type} channel</small></div>
                  <div className="admin-actions">
                    {channel.type === "text" && <button className={channel.is_locked ? "active" : ""} onClick={() => setChannelAccessOpen(channel)}>🔒 {channel.is_locked ? "Locked" : "Lock"}</button>}
                    {channel.type === "text" && <button onClick={() => setChannelAccessOpen(channel)}>🏷️ Access</button>}
                    <button onClick={() => renameChannel(channel)}>✏️ Rename</button>
                    <button className="danger" onClick={() => deleteChannel(channel)}>🗑️ Delete</button>
                  </div>
                </div>)}
              </div>
            </>}
          </div>}
        </section>
      </div>
    </div>}
  </div>;
}

function MessageList({ messages, profiles }) {
  return <div className="messages">{messages.map(m => {
    const u = profiles.find(p => p.id === m.user_id);
    return <div className="message" key={m.id}><button onClick={() => {}}><Avatar user={u} small /></button><div><div><b>{u?.display_name || "User"}</b><span className="time">{new Date(m.created_at).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})}</span></div><p>{m.content}</p></div></div>;
  })}</div>;
}

function Composer({ text, setText, send, disabled = false, placeholder = "Write a message..." }) {
  return <div className="composer"><input value={text} disabled={disabled} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !disabled) send(); }} placeholder={placeholder} /><button className="primary send" disabled={disabled} onClick={send}>➤</button></div>;
}

function PrivateCall({ user, me, conversationId, onClose }) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [remoteStream, setRemoteStream] = useState(null);
  const localStream = useRef(null);
  const peer = useRef(null);
  const room = useRef(null);
  const remoteAudio = useRef(null);

  const send = payload => room.current?.send({ type: "broadcast", event: "signal", payload });

  async function connectPeer(peerId, createOffer = false) {
    if (peer.current) return peer.current;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peer.current = pc;
    localStream.current?.getTracks().forEach(track => pc.addTrack(track, localStream.current));
    pc.onicecandidate = e => e.candidate && send({ kind: "ice", to: peerId, from: me.id, candidate: e.candidate });
    pc.ontrack = e => setRemoteStream(e.streams[0]);
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        pc.close(); peer.current = null; setRemoteStream(null);
      }
    };
    if (createOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ kind: "offer", to: peerId, from: me.id, description: pc.localDescription });
    }
    return pc;
  }

  async function join() {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      room.current = supabase.channel(`call:${conversationId}`, { config: { presence: { key: me.id }, broadcast: { self: false } } });
      room.current
        .on("broadcast", { event: "signal" }, async ({ payload }) => {
          if (!payload || payload.to !== me.id) return;
          if (payload.kind === "offer") {
            const pc = await connectPeer(payload.from, false);
            await pc.setRemoteDescription(payload.description);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            send({ kind: "answer", to: payload.from, from: me.id, description: pc.localDescription });
          }
          if (payload.kind === "answer" && peer.current) await peer.current.setRemoteDescription(payload.description);
          if (payload.kind === "ice" && peer.current) { try { await peer.current.addIceCandidate(payload.candidate); } catch {} }
          if (payload.kind === "leave") { peer.current?.close(); peer.current = null; setRemoteStream(null); }
        })
        .on("presence", { event: "sync" }, async () => {
          const state = room.current.presenceState();
          const ids = Object.values(state).flat().map(x => x.user_id || x.key).filter(Boolean);
          setParticipants(Array.from(new Set(ids)));
          const other = ids.find(id => id !== me.id);
          if (other && me.id < other) await connectPeer(other, true);
        })
        .on("presence", { event: "join" }, async ({ key }) => {
          setParticipants(p => Array.from(new Set([...p, key])));
          if (key !== me.id && me.id < key) await connectPeer(key, true);
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          setParticipants(p => p.filter(id => id !== key));
          if (key !== me.id) { peer.current?.close(); peer.current = null; setRemoteStream(null); }
        })
        .subscribe(async status => {
          if (status !== "SUBSCRIBED") return;
          setJoined(true);
          await room.current.track({ user_id: me.id, display_name: me.display_name });
        });
    } catch (e) {
      alert(e.message || "Microphone permission was denied.");
    }
  }

  async function leave() {
    send({ kind: "leave", from: me.id });
    if (room.current) { await room.current.untrack(); supabase.removeChannel(room.current); }
    peer.current?.close(); peer.current = null;
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null; setRemoteStream(null); setJoined(false); onClose();
  }

  async function toggleMute() {
    const next = !muted;
    localStream.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
    setMuted(next);
  }

  useEffect(() => { if (remoteAudio.current) remoteAudio.current.srcObject = remoteStream; }, [remoteStream]);
  useEffect(() => { join(); return () => { if (room.current || localStream.current) leave(); }; }, []);

  return <div className="call-panel">
    <div><b>📞 Call with {user.display_name}</b><span>{joined ? `${participants.length || 1} participant${participants.length === 1 ? "" : "s"} connected` : "Connecting..."}</span></div>
    <audio ref={remoteAudio} autoPlay playsInline muted={deafened} />
    <div className="call-participants">
      <div className="call-person"><Avatar user={me} small /><span>{me.display_name} <small>{muted ? "Muted" : "Speaking ready"}</small></span></div>
      <div className="call-person"><Avatar user={user} small /><span>{user.display_name} <small>{remoteStream ? "Connected" : "Waiting for audio"}</small></span></div>
    </div>
    <div className="controls">
      <button onClick={toggleMute}>{muted ? "🎙️ Unmute" : "🎤 Mute"}</button>
      <button onClick={() => setDeafened(v => !v)}>{deafened ? "🔊 Undeafen" : "🔇 Deafen"}</button>
      <button className="danger" onClick={leave}>📞 End Call</button>
    </div>
  </div>;
}

const CSS = `
*{box-sizing:border-box}html,body,#root{margin:0;width:100%;height:100%;font-family:Inter,system-ui,sans-serif;background:#0b111b;color:#eef4ff}button,input,textarea{font:inherit}button{cursor:pointer;border:0;color:inherit}input,textarea{width:100%;background:#111a29;border:1px solid #2d3b52;color:white;border-radius:10px;padding:12px}textarea{min-height:90px;resize:vertical}label{font-size:12px;font-weight:800;color:#9aa9bf}.app{display:flex;width:100%;height:100%;overflow:hidden;background:#101722}.loading,.auth{height:100%;display:grid;place-items:center;background:radial-gradient(circle at top,#243c66,#0a0f17)}.auth-card{width:min(430px,94vw);padding:32px;background:#151f2e;border:1px solid #30425e;border-radius:22px;box-shadow:0 30px 90px #0008}.logo,.big-logo{width:68px;height:68px;display:grid;place-items:center;border-radius:20px;background:linear-gradient(135deg,#4d86ff,#263ed0);font-size:36px;font-weight:900}.auth h1{margin:15px 0 5px;font-size:32px}.auth p,.muted{color:#8291a8}.auth form{display:grid;gap:9px;margin-top:22px}.primary,.danger,.controls button,.header button,.composer button{padding:11px 14px;border-radius:10px;background:#4d82ff;color:white;font-weight:800}.danger{background:#b93647}.link{background:transparent;color:#77a1ff;width:100%;margin-top:15px}.error{padding:10px;border-radius:9px;background:#47222b;color:#ffb4bf;font-size:13px}.rail{width:76px;min-width:76px;background:#0a1018;border-right:1px solid #202d40;display:flex;flex-direction:column;align-items:center;gap:9px;padding:10px}.rail-btn{width:52px;height:52px;border-radius:16px;background:#182334;font-weight:900;font-size:18px;display:grid;place-items:center;overflow:hidden}.rail-btn img{width:100%;height:100%;object-fit:cover}.rail-btn.active{background:#315ecf;box-shadow:0 0 0 2px #6e9bff}.rail-btn.add{color:#7da7ff;font-size:27px}.divider{height:1px;width:34px;background:#29384e}.spacer{flex:1}.sidebar{width:270px;min-width:270px;background:#151e2c;border-right:1px solid #26354c;overflow:auto}.side-head{height:72px;padding:14px 16px;border-bottom:1px solid #26354c;display:flex;justify-content:space-between;align-items:center}.side-head small,.side-section{color:#718098;font-size:10px;font-weight:900;letter-spacing:1.2px}.side-head h3{margin:2px 0 0}.side-head button,.side-add{background:transparent;color:#86a9ff;padding:10px}.side-section{padding:15px 13px 6px}.user-row,.channel{width:100%;display:flex;align-items:center;gap:9px;background:transparent;padding:9px 11px;text-align:left;border-radius:8px}.user-row:hover,.channel:hover,.selected{background:#22304a}.user-row span{display:flex;flex-direction:column;min-width:0}.user-row small{color:#78869d}.online{margin-left:auto;width:8px;height:8px;border-radius:50%;background:#45d77b}.server-about{padding:14px;color:#8795aa;font-size:12px}.main{flex:1;min-width:0;display:flex;flex-direction:column;background:#101722}.header{min-height:68px;padding:10px 18px;border-bottom:1px solid #26354c;background:#131c29;display:flex;align-items:center;justify-content:space-between;gap:10px}.header span{color:#75849b;font-size:12px;margin-left:10px}.header-user{display:flex;align-items:center;gap:8px;cursor:pointer}.messages{flex:1;overflow:auto;padding:18px 22px}.message{display:flex;gap:10px;padding:8px 0}.message p{margin:3px 0;color:#d4dcea;overflow-wrap:anywhere}.time{color:#68778e;font-size:10px;margin-left:7px}.composer{display:flex;gap:9px;padding:12px 17px;border-top:1px solid #26354c;background:#131c29}.send{width:50px}.empty{flex:1;display:grid;place-items:center;align-content:center;text-align:center;padding:30px}.empty p{color:#7f8da4}.big-logo{margin:auto}.avatar{width:52px;height:52px;border-radius:15px;object-fit:cover;background:linear-gradient(135deg,#435f98,#23334f);display:grid;place-items:center;font-weight:900}.avatar.small{width:36px;height:36px;border-radius:11px;font-size:12px}.modal-bg{position:fixed;inset:0;background:#000b;z-index:20;display:grid;place-items:center;padding:20px}.modal{position:relative;width:min(560px,96vw);max-height:92vh;overflow:auto;background:#151f2e;border:1px solid #30425e;border-radius:18px;padding:25px}.close{position:absolute;right:14px;top:12px;background:#26364e;border-radius:8px;width:34px;height:34px;font-size:22px}.modal form{display:grid;gap:9px}.profile-top{display:flex;align-items:center;gap:14px;margin-bottom:20px}.profile-top h2{margin:0}.profile-top span,.profile-read p{color:#8493a9}.badges{display:flex;gap:6px;flex-wrap:wrap}.staff-badge{padding:4px 7px;border:1px solid #3b5276;background:#22314b;border-radius:8px;font-size:11px;color:#eef4ff}.profile-name-block{min-width:0}.profile-username{color:#8493a9;font-size:13px;margin-top:2px}.profile-staff-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.profile-staff-row .staff-badge{cursor:pointer}.header-user-text{display:flex;flex-direction:column;min-width:0}.header-user-text>span{margin-left:0}.results{margin-top:12px}.result{width:100%;display:flex;gap:10px;align-items:center;background:transparent;padding:9px;text-align:left;border-radius:9px}.result:hover{background:#22304a}.result span{display:flex;flex-direction:column}.result small{color:#7b899e}.toast{position:fixed;right:20px;bottom:20px;z-index:50;background:#22314b;border:1px solid #46618b;padding:12px 16px;border-radius:10px}.voice{flex:1;overflow:auto;padding:28px}.voice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:20px 0}.video-tile{background:#0b111b;border:1px solid #2b3b54;border-radius:14px;overflow:hidden;padding:8px}.video-tile video{width:100%;aspect-ratio:16/9;object-fit:cover;background:#05080d;border-radius:10px}.video-tile b{display:block;padding:7px}.member-list{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.member-list>div{display:flex;align-items:center;gap:7px;background:#182437;padding:7px 9px;border-radius:9px}.controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.controls button{background:#26364e}.call-panel{position:fixed;right:20px;bottom:20px;width:min(340px,90vw);background:#172337;border:1px solid #3d5272;padding:18px;border-radius:14px;z-index:30;display:grid;gap:10px}.call-panel span{color:#8d9ab0;font-size:12px}.call-participants{display:grid;gap:7px}.call-person{display:flex;align-items:center;gap:9px;background:#1c2a40;border:1px solid #30435f;padding:8px;border-radius:10px}.call-person span{display:flex;flex-direction:column}.call-person small{color:#8292aa;margin-top:2px}.call-incoming{width:min(480px,94vw)}@media(max-width:800px){.rail{width:60px;min-width:60px}.rail-btn{width:44px;height:44px}.sidebar{width:210px;min-width:210px}}@media(max-width:620px){.sidebar{width:185px;min-width:185px}.messages{padding:14px}.voice{padding:18px}}

/* CROSS-PLATFORM / MOBILE SUPPORT */
.mobile-menu-btn{display:none}
.mobile-overlay{display:none}
@media (max-width: 700px){
  html,body,#root{height:100%;height:100dvh;min-height:100%;overflow:hidden}
  body{
    -webkit-text-size-adjust:100%;
    overscroll-behavior:none;
  }
  button,input,textarea,select{
    touch-action:manipulation;
  }
  .app{
    position:relative;
    display:flex;
    flex-direction:column;
    width:100%;
    height:100%;
    height:100dvh;
    min-height:0;
    overflow:hidden;
  }
  .rail{
    width:100%;
    min-width:0;
    height:64px;
    min-height:64px;
    flex-direction:row;
    justify-content:flex-start;
    padding:8px max(8px, env(safe-area-inset-left)) 8px max(8px, env(safe-area-inset-left));
    gap:8px;
    overflow-x:auto;
    overflow-y:hidden;
    border-right:0;
    border-bottom:1px solid #202d40;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .rail::-webkit-scrollbar{display:none}
  .rail .spacer{display:block;flex:1;min-width:8px}
  .rail .divider{width:1px;height:32px;flex:0 0 1px}
  .rail-btn,.mobile-menu-btn{width:46px;height:46px;min-width:46px;min-height:46px;border-radius:13px}
  .mobile-menu-btn{display:grid;place-items:center;background:#182334;color:#dce7f7;font-size:22px}
  .rail-btn.add{font-size:24px}
  .sidebar{
    position:absolute;
    left:0;
    top:64px;
    bottom:0;
    z-index:20;
    width:min(300px,88vw);
    min-width:0;
    height:auto;
    transform:translateX(-105%);
    transition:transform .18s ease;
    box-shadow:18px 0 45px rgba(0,0,0,.45);
    padding-bottom:max(0px, env(safe-area-inset-bottom));
  }
  .sidebar.mobile-open{transform:translateX(0)}
  .mobile-overlay{
    display:block;
    position:absolute;
    inset:64px 0 0 0;
    z-index:19;
    background:rgba(0,0,0,.55);
    border:0;
    padding:0;
  }
  .main{
    width:100%;
    min-width:0;
    height:calc(100dvh - 64px);
    flex:1;
  }
  .header{
    min-height:60px;
    padding:8px 12px;
  }
  .header button{
    min-height:44px;
  }
  .messages{
    padding:14px 12px;
    -webkit-overflow-scrolling:touch;
  }
  .composer{
    padding:9px 10px max(9px, env(safe-area-inset-bottom));
  }
  .composer input{
    min-width:0;
    font-size:16px;
  }
  .send{
    width:46px;
    min-width:46px;
    min-height:46px;
  }
  .voice{
    padding:18px 12px;
    -webkit-overflow-scrolling:touch;
  }
  .voice-grid{
    grid-template-columns:1fr;
  }
  .video-tile video{
    max-height:55vh;
  }
  .controls button{
    min-height:46px;
    flex:1 1 140px;
  }
  .modal-bg{
    align-items:flex-end;
    padding:0;
  }
  .modal{
    width:100%;
    max-width:none;
    max-height:92dvh;
    border-radius:20px 20px 0 0;
    padding:22px 16px max(22px, env(safe-area-inset-bottom));
  }
  .auth{
    min-height:100dvh;
    padding:max(16px, env(safe-area-inset-top)) 14px max(16px, env(safe-area-inset-bottom));
  }
  .auth-card{
    width:100%;
    max-width:460px;
    padding:25px 18px;
  }
  .profile-top{
    align-items:center;
  }
}

@media (max-width: 430px){
  .rail{height:58px;min-height:58px}
  .mobile-menu-btn,.rail-btn{width:42px;height:42px;min-width:42px;min-height:42px}
  .sidebar{top:58px}
  .mobile-overlay{inset:58px 0 0 0}
  .main{height:calc(100dvh - 58px)}
  .header span{display:none}
  .header-user b{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .message{gap:8px}
  .avatar.small{width:34px;height:34px}
}

@media (pointer:coarse){
  button,input,select,textarea{min-height:44px}
  .rail-btn img{pointer-events:none}
}

@media (prefers-reduced-motion:reduce){
  .sidebar{transition:none}
}
`;

class VexelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Vexel runtime error:", error, info);
  }
  render() {
    if (this.state.error) {
      const message = this.state.error?.message || String(this.state.error);
      return <div style={{minHeight:"100vh",background:"#0b111b",color:"#fff",padding:"32px",fontFamily:"system-ui, sans-serif"}}>
        <div style={{maxWidth:"760px",margin:"0 auto",background:"#121c2a",border:"1px solid #334865",borderRadius:"16px",padding:"24px"}}>
          <h1 style={{marginTop:0}}>Vexel encountered an error</h1>
          <p style={{color:"#a9b8cc"}}>The app loaded, but something stopped React from rendering. Send me the error below and I can fix it.</p>
          <pre style={{whiteSpace:"pre-wrap",background:"#080d14",padding:"16px",borderRadius:"10px",overflowX:"auto",color:"#ffd6d6"}}>{message}</pre>
          <button type="button" onClick={() => window.location.reload()} style={{padding:"10px 14px",borderRadius:"9px",border:0,cursor:"pointer"}}>Reload Vexel</button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

export default function VexelApp() {
  return <VexelErrorBoundary><App /></VexelErrorBoundary>;
}