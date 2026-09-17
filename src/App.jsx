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
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");

      if (mode === "login") {
        const credentials = method === "email"
          ? { email: email.trim().toLowerCase(), password }
          : { phone: phone.trim(), password };
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
        onDone(false);
        return;
      }

      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
        throw new Error("Username must be 3-24 letters, numbers, or underscores.");
      }

      const options = {
        data: {
          username: username.trim().toLowerCase(),
          display_name: displayName.trim() || username.trim()
        }
      };

      const { data, error } = method === "email"
        ? await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options
          })
        : await supabase.auth.signUp({
            phone: phone.trim(),
            password,
            options
          });

      if (error) throw error;
      if (!data.session) {
        setError(
          method === "email"
            ? "Account created. If email confirmation is enabled, confirm your email and then sign in."
            : "Account created. If phone confirmation is enabled, complete it and then sign in."
        );
      } else {
        onDone(true);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth">
    <div className="auth-card">
      <div className="logo">V</div>
      <h1>Vexel</h1>
      <p>Sign in with your email or phone number and password.</p>

      <div className="auth-methods">
        <button type="button" className={method === "email" ? "primary" : "secondary"} onClick={() => { setMethod("email"); setError(""); }} disabled={busy}>
          Email
        </button>
        <button type="button" className={method === "phone" ? "primary" : "secondary"} onClick={() => { setMethod("phone"); setError(""); }} disabled={busy}>
          Phone
        </button>
      </div>

      <form onSubmit={submit}>
        {mode === "signup" && <>
          <label>Vexel @username</label>
          <input value={username} onChange={e => setUsername(e.target.value.replace(/^@/, ""))} placeholder="@username" maxLength={24} required />
          <label>Display name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" maxLength={40} />
        </>}

        <label>{method === "email" ? "Email address" : "Phone number"}</label>
        {method === "email" ? (
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        ) : (
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 502 555 0123" autoComplete="tel" required />
        )}

        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required />

        {error && <div className="error">{error}</div>}

        <button className="primary" disabled={busy}>
          {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <button type="button" className="link" disabled={busy} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
        {mode === "login" ? "New to Vexel? Create an account" : "Already have a Vexel account? Sign in"}
      </button>
    </div>
  </div>;
}

function VexelTerms({ onAccept }) {
  const [accepted, setAccepted] = useState(false);

  return <div className="modal-bg terms-bg">
    <div className="modal terms-modal">
      <div className="terms-brand">
        <div className="logo">V</div>
        <div>
          <small>VEXEL OFFICIAL</small>
          <h1>Terms of Service</h1>
        </div>
      </div>
      <p className="terms-intro">
        Welcome to Vexel. These Terms of Service and Community Rules explain the basic rules
        for using Vexel. By using Vexel, you agree to follow these rules and applicable laws.
      </p>

      <div className="terms-scroll">
        <section><h3>1. Accepting the Terms</h3><p>You must follow these Terms of Service, the Vexel Community Rules, and applicable laws while using Vexel.</p></section>
        <section><h3>2. Your Account</h3><p>Keep your account information accurate and protect your password. Do not share your password or intentionally allow another person to use your account.</p></section>
        <section><h3>3. Respect Other People</h3><p>Do not harass, threaten, bully, stalk, or repeatedly target other users. Treat people respectfully in messages, servers, profiles, and voice channels.</p></section>
        <section><h3>4. Illegal or Harmful Activity</h3><p>Do not use Vexel to plan, promote, coordinate, or facilitate illegal activity, serious threats, fraud, or other harmful conduct.</p></section>
        <section><h3>5. Spam and Abuse</h3><p>Do not spam messages, create disruptive automated activity, abuse Vexel features, or attempt to bypass reasonable service limits or moderation.</p></section>
        <section><h3>6. Impersonation</h3><p>Do not impersonate Vexel staff, another user, a business, organization, or public service in a misleading way.</p></section>
        <section><h3>7. Content</h3><p>You are responsible for content you post. Do not upload or distribute content that violates the law or another person's rights. Respect copyright and intellectual-property rights.</p></section>
        <section><h3>8. Servers and Moderation</h3><p>Server owners may establish additional server rules. Vexel staff may review reports and take action when users or content violate Vexel rules.</p></section>
        <section><h3>9. Safety</h3><p>Do not encourage dangerous behavior or use Vexel to put another person at unreasonable risk.</p></section>
        <section><h3>10. Privacy</h3><p>Do not post another person's private information without permission. Vexel may process information needed to operate accounts and features.</p></section>
        <section><h3>11. Enforcement</h3><p>Rule violations may result in content removal, restrictions, removal from a server, suspension, or account termination depending on the situation.</p></section>
        <section><h3>12. Changes to Vexel</h3><p>Vexel may change features, rules, or these Terms as the service develops.</p></section>
        <section><h3>13. Contact and Support</h3><p>Use the official Vexel support process for account, safety, moderation, or technical concerns.</p></section>
      </div>

      <label className="terms-check">
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
        <span>I have read and agree to the Vexel Terms of Service and Community Rules.</span>
      </label>
      <button type="button" className="primary terms-accept" disabled={!accepted} onClick={onAccept}>
        Accept & Continue
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

function InviteModal({ server, onClose, onInvite }) {
  const [copied, setCopied] = useState(false);
  const inviteCode = server?.invite_code || "";
  const publicOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
  const inviteLink = inviteCode ? `${publicOrigin}/?invite=${encodeURIComponent(inviteCode)}` : "";

  async function copyLink() {
    if (!inviteLink) return;
    const ok = await onInvite(inviteLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return <div className="modal-bg"><div className="modal invite-modal">
    <button className="close" onClick={onClose}>×</button>
    <div className="profile-top">
      <Avatar user={{ display_name: server?.name, avatar_url: server?.icon_url }} />
      <div><h2>Invite People</h2><span>Invite someone to {server?.name}</span></div>
    </div>
    <p className="invite-note">Anyone with this link can join this server after signing in or creating a Vexel account.</p>
    <label>Server invite link</label>
    <div className="invite-link-row">
      <input value={inviteLink} readOnly onFocus={e => e.target.select()} />
      <button className="primary" type="button" onClick={copyLink}>{copied ? "✓ Copied" : "Copy"}</button>
    </div>
    <div className="invite-code">Invite code: <b>{inviteCode || "Unavailable"}</b></div>
  </div></div>;
}

function JoinServerModal({ onClose, onJoin }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const value = code.trim();
    if (!value) return setError("Enter a server invite code.");
    setBusy(true);
    setError("");
    const ok = await onJoin(value);
    setBusy(false);
    if (!ok) setError("That invite code is invalid or could not be used.");
  }

  return <div className="modal-bg">
    <form className="modal join-server-modal" onSubmit={submit}>
      <button className="close" type="button" onClick={onClose}>×</button>
      <div className="tutorial-icon">🔑</div>
      <h2>Join a Server</h2>
      <p className="muted">Enter the server invite code someone gave you.</p>
      <label>Server invite code</label>
      <input
        autoFocus
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Example: A1B2C3D4"
        maxLength={64}
        autoComplete="off"
      />
      {error && <div className="form-error">{error}</div>}
      <button className="primary" type="submit" disabled={busy}>
        {busy ? "Joining…" : "Join Server"}
      </button>
    </form>
  </div>;
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


function TutorialModal({ onClose }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Welcome to Vexel", text: "Vexel is your place for private messages, servers, voice channels, and your profile." },
    { title: "Home & DMs", text: "Press the V button to open Home. Use Add People to search for someone by their Vexel @username and start a private DM." },
    { title: "Servers", text: "Click a server icon to enter that server. Server channels stay inside that server, while private DMs stay on Home." },
    { title: "Invites", text: "Inside a server, press Invite People, copy the invite link, and send it to someone. After they sign in, the invite can open the server for them." },
    { title: "Profile & Exit", text: "Use the profile button to edit your profile. Use Exit when you want to sign out of Vexel." }
  ];
  const current = steps[step];
  return <div className="modal-bg">
    <div className="modal tutorial-modal">
      <button className="close" type="button" onClick={onClose}>×</button>
      <div className="tutorial-icon">V</div>
      <div className="tutorial-progress">STEP {step + 1} OF {steps.length}</div>
      <h2>{current.title}</h2>
      <p className="tutorial-text">{current.text}</p>
      <div className="tutorial-dots">{steps.map((_, i) => <button key={i} type="button" className={i === step ? "tutorial-dot active" : "tutorial-dot"} aria-label={`Go to step ${i + 1}`} onClick={() => setStep(i)} />)}</div>
      <div className="tutorial-actions">
        <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
        {step < steps.length - 1
          ? <button type="button" className="primary" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>Next</button>
          : <button type="button" className="primary" onClick={onClose}>Finish</button>}
      </div>
    </div>
  </div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [dmProfiles, setDmProfiles] = useState([]);
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [serverMembers, setServerMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dmMessages, setDmMessages] = useState([]);
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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const inviteProcessedRef = useRef(null);

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
    const [{ data: ps }, { data: ss }, { data: dmRows }] = await Promise.all([
      supabase.from("profiles").select("*").order("display_name"),
      supabase.from("servers").select("*").order("created_at"),
      supabase.from("dm_members").select("conversation_id,user_id")
    ]);
    const allProfiles = ps || [];
    setProfiles(allProfiles);

    // Only people who are already in a private conversation with this user
    // belong in the Home/DM list. Do not treat every Vexel account as a DM.
    const dmRowsSafe = dmRows || [];
    const myConversationIds = new Set(dmRowsSafe.filter(row => row.user_id === session.user.id).map(row => row.conversation_id));
    const dmUserIds = new Set(dmRowsSafe.filter(row => myConversationIds.has(row.conversation_id) && row.user_id !== session.user.id).map(row => row.user_id));
    setDmProfiles(allProfiles.filter(p => dmUserIds.has(p.id)));

    const membershipsResult = await supabase.from("server_members").select("server_id").eq("user_id", session.user.id);
    const memberships = membershipsResult.data || [];
    const allowed = new Set(memberships.map(x => x.server_id));
    setServers((ss || []).filter(s => allowed.has(s.id) || s.owner_id === session.user.id));
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

  function openChannel(id) {
    // Selecting a channel is instant. The channelId effect below loads its
    // messages automatically, so there is no second click or stale load.
    setPage("server");
    setChannelId(id);
    setVoiceOpen(false);
    setMobileMenu(false);
  }

  async function openDm(user) {
    if (!user?.id || !session?.user?.id) return;

    setPage("home");
    setDmUserId(user.id);
    setServerId(null);
    setChannelId(null);
    setVoiceOpen(false);
    setMobileMenu(false);

    // DM conversations are created through a SECURITY DEFINER RPC.
    // This keeps the database RLS protection in place while allowing the
    // signed-in user to safely create a private conversation with another user.
    const { data: conversationId, error } = await supabase.rpc("create_dm_conversation", {
      p_other_user: user.id
    });

    if (error) {
      notify("Could not open DM", error.message, "⚠️");
      return;
    }

    if (!conversationId) {
      notify("Could not open DM. No conversation was created.", "", "⚠️");
      return;
    }

    // Setting the conversation id automatically loads the DM messages in the
    // effect below. This keeps the DM view in sync without another click.
    setDmConversationId(conversationId);
    setDmProfiles(current => current.some(p => p.id === user.id) ? current : [...current, user].sort((a, b) => a.display_name.localeCompare(b.display_name)));
  }

  async function send() {
    const content = text.trim();
    if (!content) return;

    // Clear the box immediately so Enter always feels instant. The saved
    // message is then added to the current view directly from the database
    // response, so the user never has to re-click the channel to see it.
    setText("");

    if (page === "server" && channelId) {
      if (!hasServerPermission("send_messages")) {
        setText(content);
        notify("You do not have permission to send messages in this server.");
        return;
      }
      const activeChannelId = channelId;
      const { data, error } = await supabase
        .from("server_messages")
        .insert({ channel_id: activeChannelId, user_id: me.id, content })
        .select()
        .single();
      if (error) {
        setText(content);
        notify(error.message);
        return;
      }
      // Only add it if the user is still looking at that same channel.
      if (activeChannelId === channelId) {
        setMessages(current => current.some(x => x.id === data.id) ? current : [...current, data]);
      }
    } else if (page === "home" && dmConversationId) {
      const activeConversationId = dmConversationId;
      const { data, error } = await supabase
        .from("dm_messages")
        .insert({ conversation_id: activeConversationId, user_id: me.id, content })
        .select()
        .single();
      if (error) {
        setText(content);
        notify(error.message);
        return;
      }
      if (activeConversationId === dmConversationId) {
        setDmMessages(current => current.some(x => x.id === data.id) ? current : [...current, data]);
      }
    }
  }

  // Reload messages automatically whenever the selected channel changes.
  // This also protects against stale results when switching channels quickly.
  useEffect(() => {
    let cancelled = false;
    if (page !== "server" || !channelId) return undefined;
    setMessages([]);
    supabase.from("server_messages").select("*").eq("channel_id", channelId).order("created_at")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { notify(error.message); return; }
        setMessages(data || []);
      });
    return () => { cancelled = true; };
  }, [page, channelId]);

  // Reload the open DM automatically whenever its conversation changes.
  useEffect(() => {
    let cancelled = false;
    if (page !== "home" || !dmConversationId) return undefined;
    setDmMessages([]);
    supabase.from("dm_messages").select("*").eq("conversation_id", dmConversationId).order("created_at")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { notify(error.message); return; }
        setDmMessages(data || []);
      });
    return () => { cancelled = true; };
  }, [page, dmConversationId]);

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

  async function copyServerInvite(link) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const area = document.createElement("textarea");
        area.value = link;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      notify("Invite link copied. Send it to anyone you want to invite.");
      return true;
    } catch (e) {
      notify("Could not copy automatically. Select the invite link and copy it manually.");
      return false;
    }
  }

  async function joinServerByCode(code) {
    const cleanCode = String(code || "").trim();
    if (!cleanCode) return false;
    const { data, error } = await supabase.rpc("join_server_by_invite", { p_invite_code: cleanCode });
    if (error) {
      notify(error.message || "That invite code is invalid or could not be used.");
      return false;
    }
    const joinedServer = Array.isArray(data) ? data[0] : data;
    if (!joinedServer?.id) {
      notify("That invite code is invalid or could not be used.");
      return false;
    }
    setServers(current => current.some(s => s.id === joinedServer.id)
      ? current.map(s => s.id === joinedServer.id ? { ...s, ...joinedServer } : s)
      : [...current, joinedServer].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    setJoinOpen(false);
    setMobileMenu(false);
    notify(`Joined ${joinedServer.name}.`);
    await openServer(joinedServer.id);
    return true;
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
    await supabase.from("channels").insert([
      { server_id: data.id, name: "general", type: "text" },
      { server_id: data.id, name: "General Voice", type: "voice" }
    ]);
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
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("invite")?.trim();
    if (!inviteCode || inviteProcessedRef.current === inviteCode) return;

    inviteProcessedRef.current = inviteCode;
    (async () => {
      const { data, error } = await supabase.rpc("join_server_by_invite", { p_invite_code: inviteCode });
      const joinedServer = Array.isArray(data) ? data[0] : data;
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);

      if (error || !joinedServer?.id) {
        notify(error?.message || "That invite is invalid or no longer exists.");
        return;
      }

      setServers(current => current.some(s => s.id === joinedServer.id)
        ? current.map(s => s.id === joinedServer.id ? joinedServer : s)
        : [...current, joinedServer].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
      notify(`Joined ${joinedServer.name}. Opening the server...`);
      await openServer(joinedServer.id);
    })();
  }, [session?.user?.id, me?.id]);

  useEffect(() => {
    if (!session?.user || !me) return;
    loadAll();

    const presence = supabase.channel("global-presence");
    presence.on("presence", { event: "sync" }, () => {}).subscribe(async status => {
      if (status === "SUBSCRIBED") {
        await presence.track({ user_id: me.id, online_at: new Date().toISOString() });
      }
    });

    const changes = supabase.channel("vexel-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "server_messages" }, p => {
        if (p.eventType === "INSERT") {
          // Only add the message to the channel that is currently open.
          if (p.new.channel_id === channelId) {
            setMessages(m => m.some(x => x.id === p.new.id) ? m : [...m, p.new]);
          }
          if (p.new.user_id !== me.id && p.new.channel_id === channelId) {
            notify("New server message");
          }
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages" }, p => {
        if (p.eventType === "INSERT") {
          // Only add the message to the DM that is currently open.
          if (p.new.conversation_id === dmConversationId) {
            setDmMessages(m => m.some(x => x.id === p.new.id) ? m : [...m, p.new]);
          }
          if (p.new.user_id !== me.id && p.new.conversation_id === dmConversationId) {
            notify("New private message");
          }
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, p => {
        if (p.eventType === "INSERT") {
          setProfiles(a => [...a.filter(x => x.id !== p.new.id), p.new]);
        }
        if (p.eventType === "UPDATE") {
          setProfiles(a => a.map(x => x.id === p.new.id ? p.new : x));
          if (p.new.id === me.id) setMe(p.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presence);
      supabase.removeChannel(changes);
    };
  }, [session?.user?.id, me?.id, dmConversationId, channelId]);

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
  if (!session || !me) return <Auth onDone={(isNewAccount) => {
    if (isNewAccount) {
      setNeedsOnboarding(true);
      setTutorialOpen(true);
    }
  }} />;

  if (needsOnboarding) return <>
    {tutorialOpen && <TutorialModal onClose={() => { setTutorialOpen(false); setTermsOpen(true); }} />}
    {termsOpen && <VexelTerms onAccept={() => { setTermsOpen(false); setNeedsOnboarding(false); }} />}
  </>;

  const visibleProfiles = dmProfiles.filter(p => p.id !== me.id);
  const availableProfiles = profiles.filter(p => p.id !== me.id);
  const serverChannels = channels.filter(c => c.server_id === serverId);

  const adminStyles = `

    .tutorial-modal{width:min(560px,96vw);text-align:center}.tutorial-icon{width:64px;height:64px;margin:0 auto 10px;display:grid;place-items:center;border-radius:18px;background:linear-gradient(135deg,#4d86ff,#263ed0);font-size:32px;font-weight:900}.tutorial-progress{font-size:11px;font-weight:900;letter-spacing:1.2px;color:#718098}.tutorial-text{color:#aab8cc;line-height:1.65;min-height:78px}.tutorial-dots{display:flex;justify-content:center;gap:7px;margin:18px 0}.tutorial-dot{width:10px;height:10px;min-height:10px;padding:0;border-radius:50%;background:#33445f}.tutorial-dot.active{background:#5b8cff}.tutorial-actions{display:flex;justify-content:center;gap:8px}.exit-btn{font-size:12px;font-weight:900}.tutorial-btn{font-size:22px}
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
      <button className="rail-btn" title="Join a Server" onClick={() => setJoinOpen(true)}>🔑</button>
      <div className="spacer" />
      {canUseAdminPanel && <button className="rail-btn" title="Vexel Admin Panel" onClick={() => setAdminOpen(true)}>🛡️</button>}
      <button className="rail-btn tutorial-btn" title="Vexel Tutorial" onClick={() => setTutorialOpen(true)}>?</button>
      <button className="rail-btn" onClick={() => setProfileOpen(me)}>👤</button>
      <button className="rail-btn exit-btn" title="Exit Vexel" onClick={() => supabase.auth.signOut()}>Exit</button>
    </aside>

    <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
      <div className="side-head"><div><small>VEXEL</small><h3>{page === "home" ? "Home" : selectedServer?.name || "Server"}</h3></div>
        {page === "home" && <button onClick={() => setAddOpen(true)}>＋</button>}
      </div>

      {page === "home" ? <>
        <div className="side-section">DIRECT MESSAGES</div>
        <button className="side-add" onClick={() => setJoinOpen(true)}>🔑 Join a Server</button>
        {visibleProfiles.map(u => <button className={dmUserId === u.id ? "user-row selected" : "user-row"} key={u.id} onClick={() => openDm(u)}>
          <Avatar user={u} small /><span><b>{u.display_name}</b><small>@{u.username}</small></span><i className={u.status === "Online" ? "online" : ""} />
        </button>)}
        {!visibleProfiles.length && <p className="muted">Use ＋ to add/search people.</p>}
      </> : <>
        <div className="server-about">{selectedServer?.description || "Server"}</div>
        {selectedServer?.invite_code && <button className="side-add invite-server-btn" onClick={() => setInviteOpen(true)}>🔗 Invite People</button>}
        <div className="side-section">TEXT CHANNELS</div>
        {serverChannels.filter(c => c.type === "text").map(c => <div className="channel-line" key={c.id}>
          <button className={channelId === c.id ? "channel selected" : "channel"} onClick={() => openChannel(c.id)}># {c.name}</button>
          {hasServerPermission("manage_channels") && <span className="channel-actions">
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

      {page === "home" && <button className="side-add" onClick={() => setAddOpen(true)}>＋ Add People</button>}
    </aside>
    {mobileMenu && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

    {page === "server" && selectedChannel && voiceOpen && selectedChannel.type === "voice" ? <Voice channel={selectedChannel} me={me} profiles={profiles} onLeave={() => setVoiceOpen(false)} /> :
      <main className="main">
        {page === "home" && dmUserId ? <>
          <header className="header"><div className="header-user" onClick={() => setProfileOpen(selectedDmUser)}><Avatar user={selectedDmUser} small /><div className="header-user-text"><b>{selectedDmUser?.display_name}</b><span>@{selectedDmUser?.username}</span><StaffBadgesUnderName user={selectedDmUser} onBadgeClick={() => {}} /></div></div><button onClick={() => setVoiceOpen(true)}>📞 Call</button></header>
          <MessageList messages={dmMessages} profiles={profiles} scrollKey={dmConversationId || "dm"} />
          <Composer text={text} setText={setText} send={send} focusKey={dmConversationId || "dm"} />
          {voiceOpen && selectedDmUser && <PrivateCall user={selectedDmUser} onClose={() => setVoiceOpen(false)} />}
        </> : page === "server" && selectedChannel ? <>
          <header className="header">
            <div><b># {selectedChannel.name}</b><span>Server channel</span></div>
            {selectedServer?.banner_url && <img className="header-server-banner" src={selectedServer.banner_url} alt="" />}
          </header>
          <MessageList messages={messages} profiles={profiles} scrollKey={channelId || "channel"} />
          <Composer text={text} setText={setText} send={send} focusKey={channelId || "channel"} />
        </> : <div className="empty"><div className="big-logo">V</div><h1>Welcome to Vexel</h1><p>Choose a server or open Home to message people privately.</p></div>}
      </main>
    }

    {profileOpen && <ProfileModal user={profileOpen} isSelf={profileOpen.id === me.id} onClose={() => setProfileOpen(null)} onSave={updateMe} onUploadAvatar={uploadAvatar} uploadingAvatar={uploadingAvatar} />}
    {rolesOpen && selectedServer && <ServerRolesModal server={selectedServer} members={serverMembers} profiles={profiles} roles={serverRoles} roleMembers={serverRoleMembers} canManage={hasServerPermission("manage_roles")} onClose={() => setRolesOpen(false)} onCreateRole={createServerRole} onUpdateRole={updateServerRole} onDeleteRole={deleteServerRole} onAssignRole={assignServerRole} onRemoveRole={removeServerRole} />}
    {addOpen && <AddPeople users={availableProfiles} onClose={() => setAddOpen(false)} onPick={u => { setAddOpen(false); openDm(u); }} />}
    {inviteOpen && selectedServer && <InviteModal server={selectedServer} onClose={() => setInviteOpen(false)} onInvite={copyServerInvite} />}
    {joinOpen && <JoinServerModal onClose={() => setJoinOpen(false)} onJoin={joinServerByCode} />}
    {tutorialOpen && <TutorialModal onClose={() => setTutorialOpen(false)} />}
    {notice && <div className="toast">🔔 {notice}</div>}

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

function MessageList({ messages, profiles, scrollKey }) {
  const listRef = useRef(null);
  const previousCount = useRef(messages.length);
  const previousKey = useRef(scrollKey);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const changedConversation = previousKey.current !== scrollKey;
    const wasNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 180;

    // When opening or switching channels/DMs, immediately show the newest
    // message instead of making the user scroll or click around.
    // For new incoming messages, preserve the reader's position if they are
    // intentionally reading older messages.
    if (changedConversation || previousCount.current === 0 || messages.length < previousCount.current || wasNearBottom) {
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    }

    previousCount.current = messages.length;
    previousKey.current = scrollKey;
  }, [messages.length, scrollKey]);

  return <div className="messages" ref={listRef}>
    {!messages.length && <div className="empty-messages">No messages yet. Start the conversation below.</div>}
    {messages.map(m => {
      const u = profiles.find(p => p.id === m.user_id);
      return <div className="message" key={m.id}>
        <button type="button" onClick={() => {}}><Avatar user={u} small /></button>
        <div>
          <div><b>{u?.display_name || "User"}</b><span className="time">{new Date(m.created_at).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})}</span></div>
          <p>{m.content}</p>
        </div>
      </div>;
    })}
  </div>;
}

function Composer({ text, setText, send, focusKey }) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Refocus every time the user opens or switches a channel/DM.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    });
  }, [focusKey]);

  return <div className="composer">
    <input
      ref={inputRef}
      autoFocus
      value={text}
      onChange={e => setText(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      }}
      placeholder="Write a message..."
      aria-label="Write a message"
    />
    <button type="button" className="primary send" onClick={send}>➤</button>
  </div>;
}

function PrivateCall({ user, onClose }) {
  return <div className="call-panel"><b>Private call with {user.display_name}</b><span>For a real one-to-one call, use a voice channel or add a private-call signaling room.</span><button className="danger" onClick={onClose}>End Call</button></div>;
}

const CSS = `
*{box-sizing:border-box}html,body,#root{margin:0;width:100%;height:100%;font-family:Inter,system-ui,sans-serif;background:#0b111b;color:#eef4ff}button,input,textarea{font:inherit}button{cursor:pointer;border:0;color:inherit}input,textarea{width:100%;background:#111a29;border:1px solid #2d3b52;color:white;border-radius:10px;padding:12px}textarea{min-height:90px;resize:vertical}label{font-size:12px;font-weight:800;color:#9aa9bf}.app{display:flex;width:100%;height:100%;overflow:hidden;background:#101722}.loading,.auth{height:100%;display:grid;place-items:center;background:radial-gradient(circle at top,#243c66,#0a0f17)}.auth-card{width:min(430px,94vw);padding:32px;background:#151f2e;border:1px solid #30425e;border-radius:22px;box-shadow:0 30px 90px #0008}.logo,.big-logo{width:68px;height:68px;display:grid;place-items:center;border-radius:20px;background:linear-gradient(135deg,#4d86ff,#263ed0);font-size:36px;font-weight:900}.auth h1{margin:15px 0 5px;font-size:32px}.auth p,.muted{color:#8291a8}.auth form{display:grid;gap:9px;margin-top:22px}.primary,.danger,.controls button,.header button,.composer button{padding:11px 14px;border-radius:10px;background:#4d82ff;color:white;font-weight:800}.danger{background:#b93647}.link{background:transparent;color:#77a1ff;width:100%;margin-top:15px}.error{padding:10px;border-radius:9px;background:#47222b;color:#ffb4bf;font-size:13px}.rail{width:76px;min-width:76px;background:#0a1018;border-right:1px solid #202d40;display:flex;flex-direction:column;align-items:center;gap:9px;padding:10px}.rail-btn{width:52px;height:52px;border-radius:16px;background:#182334;font-weight:900;font-size:18px;display:grid;place-items:center;overflow:hidden}.rail-btn img{width:100%;height:100%;object-fit:cover}.rail-btn.active{background:#315ecf;box-shadow:0 0 0 2px #6e9bff}.rail-btn.add{color:#7da7ff;font-size:27px}.divider{height:1px;width:34px;background:#29384e}.spacer{flex:1}.sidebar{width:270px;min-width:270px;background:#151e2c;border-right:1px solid #26354c;overflow:auto}.side-head{height:72px;padding:14px 16px;border-bottom:1px solid #26354c;display:flex;justify-content:space-between;align-items:center}.side-head small,.side-section{color:#718098;font-size:10px;font-weight:900;letter-spacing:1.2px}.side-head h3{margin:2px 0 0}.side-head button,.side-add{background:transparent;color:#86a9ff;padding:10px}.side-section{padding:15px 13px 6px}.user-row,.channel{width:100%;display:flex;align-items:center;gap:9px;background:transparent;padding:9px 11px;text-align:left;border-radius:8px}.user-row:hover,.channel:hover,.selected{background:#22304a}.user-row span{display:flex;flex-direction:column;min-width:0}.user-row small{color:#78869d}.online{margin-left:auto;width:8px;height:8px;border-radius:50%;background:#45d77b}.server-about{padding:14px;color:#8795aa;font-size:12px}.main{flex:1;min-width:0;display:flex;flex-direction:column;background:#101722}.header{min-height:68px;padding:10px 18px;border-bottom:1px solid #26354c;background:#131c29;display:flex;align-items:center;justify-content:space-between;gap:10px}.header span{color:#75849b;font-size:12px;margin-left:10px}.header-user{display:flex;align-items:center;gap:8px;cursor:pointer}.messages{flex:1;overflow:auto;padding:18px 22px;scroll-behavior:smooth}.empty-messages{display:grid;place-items:center;min-height:100%;color:#718098;text-align:center;padding:30px}.message{display:flex;gap:10px;padding:8px 0}.message p{margin:3px 0;color:#d4dcea;overflow-wrap:anywhere}.time{color:#68778e;font-size:10px;margin-left:7px}.composer{display:flex;gap:9px;padding:12px 17px;border-top:1px solid #26354c;background:#131c29}.send{width:50px}.empty{flex:1;display:grid;place-items:center;align-content:center;text-align:center;padding:30px}.empty p{color:#7f8da4}.big-logo{margin:auto}.avatar{width:52px;height:52px;border-radius:15px;object-fit:cover;background:linear-gradient(135deg,#435f98,#23334f);display:grid;place-items:center;font-weight:900}.avatar.small{width:36px;height:36px;border-radius:11px;font-size:12px}.modal-bg{position:fixed;inset:0;background:#000b;z-index:20;display:grid;place-items:center;padding:20px}.modal{position:relative;width:min(560px,96vw);max-height:92vh;overflow:auto;background:#151f2e;border:1px solid #30425e;border-radius:18px;padding:25px}.close{position:absolute;right:14px;top:12px;background:#26364e;border-radius:8px;width:34px;height:34px;font-size:22px}.modal form{display:grid;gap:9px}.profile-top{display:flex;align-items:center;gap:14px;margin-bottom:20px}.profile-top h2{margin:0}.profile-top span,.profile-read p{color:#8493a9}.badges{display:flex;gap:6px;flex-wrap:wrap}.staff-badge{padding:4px 7px;border:1px solid #3b5276;background:#22314b;border-radius:8px;font-size:11px;color:#eef4ff}.profile-name-block{min-width:0}.profile-username{color:#8493a9;font-size:13px;margin-top:2px}.profile-staff-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.profile-staff-row .staff-badge{cursor:pointer}.header-user-text{display:flex;flex-direction:column;min-width:0}.header-user-text>span{margin-left:0}.results{margin-top:12px}.result{width:100%;display:flex;gap:10px;align-items:center;background:transparent;padding:9px;text-align:left;border-radius:9px}.result:hover{background:#22304a}.result span{display:flex;flex-direction:column}.result small{color:#7b899e}.invite-server-btn{width:100%;text-align:left;border-top:1px solid #26354c;border-bottom:1px solid #26354c;margin:2px 0 4px}.invite-note{color:#8b9ab0;font-size:13px;line-height:1.5}.invite-link-row{display:flex;gap:8px;align-items:stretch}.invite-link-row input{min-width:0}.invite-link-row button{white-space:nowrap}.invite-code{margin-top:12px;color:#7f8da4;font-size:12px}.invite-code b{color:#dbe6f7}.invite-modal{width:min(650px,96vw)}.toast{position:fixed;right:20px;bottom:20px;z-index:50;background:#22314b;border:1px solid #46618b;padding:12px 16px;border-radius:10px}.voice{flex:1;overflow:auto;padding:28px}.voice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:20px 0}.video-tile{background:#0b111b;border:1px solid #2b3b54;border-radius:14px;overflow:hidden;padding:8px}.video-tile video{width:100%;aspect-ratio:16/9;object-fit:cover;background:#05080d;border-radius:10px}.video-tile b{display:block;padding:7px}.member-list{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.member-list>div{display:flex;align-items:center;gap:7px;background:#182437;padding:7px 9px;border-radius:9px}.controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.controls button{background:#26364e}.call-panel{position:fixed;right:20px;bottom:20px;width:min(340px,90vw);background:#172337;border:1px solid #3d5272;padding:18px;border-radius:14px;z-index:30;display:grid;gap:10px}.call-panel span{color:#8d9ab0;font-size:12px}@media(max-width:800px){.rail{width:60px;min-width:60px}.rail-btn{width:44px;height:44px}.sidebar{width:210px;min-width:210px}}@media(max-width:620px){.sidebar{width:185px;min-width:185px}.messages{padding:14px}.voice{padding:18px}}

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
.auth-methods{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:18px}.secondary{padding:11px 14px;border-radius:10px;background:#26364e;color:#dce7f8;font-weight:800}.terms-bg{z-index:70}.terms-modal{width:min(760px,96vw);max-height:94vh}.terms-brand{display:flex;align-items:center;gap:14px;margin-bottom:12px}.terms-brand .logo{width:58px;height:58px;font-size:30px}.terms-brand small{color:#718098;font-size:10px;font-weight:900;letter-spacing:1.4px}.terms-brand h1{margin:3px 0 0}.terms-intro{color:#9aa9bf;line-height:1.55}.terms-scroll{max-height:48vh;overflow:auto;padding:4px 4px 4px 0;margin:14px 0;border-top:1px solid #26354c;border-bottom:1px solid #26354c}.terms-scroll section{padding:11px 0;border-bottom:1px solid #202e43}.terms-scroll section:last-child{border-bottom:0}.terms-scroll h3{margin:0 0 5px;font-size:14px}.terms-scroll p{margin:0;color:#9aa9bf;font-size:12px;line-height:1.55}.terms-check{display:flex;align-items:flex-start;gap:10px;color:#dbe5f4;font-size:13px;line-height:1.45;cursor:pointer}.terms-check input{width:auto;min-width:18px;margin-top:2px}.terms-accept{width:100%;margin-top:14px}.join-server-modal{max-width:440px}.join-server-modal input{width:100%;box-sizing:border-box;margin:8px 0 12px}.join-server-modal .primary{width:100%;margin-top:10px}.join-server-modal .form-error{color:#ff8f8f;background:#3a1f27;border:1px solid #6a2d3a;padding:8px 10px;border-radius:8px;margin-bottom:10px}.join-server-modal .muted{margin:0 0 14px}
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

