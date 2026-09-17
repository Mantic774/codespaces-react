import React, { useEffect, useState } from "react";

/* =========================================================
   VEXEL
   Single-file React app
========================================================= */

const STORAGE = {
  users: "vexel_users",
  currentUser: "vexel_current_user",
  servers: "vexel_servers",
  messages: "vexel_messages",
  dms: "vexel_dms",
};

const STAFF_BADGES = {
  owner: {
    name: "Owner",
    icon: "👑",
    description: "Official creator and owner of Vexel.",
  },
  developer: {
    name: "Developer",
    icon: "💻",
    description: "Official Vexel development staff.",
  },
  coowner: {
    name: "Co-Owner",
    icon: "⭐",
    description: "Official Vexel co-owner.",
  },
  admin: {
    name: "Admin",
    icon: "🛡️",
    description: "Official Vexel administrator.",
  },
  moderator: {
    name: "Moderator",
    icon: "🔨",
    description: "Official Vexel moderator.",
  },
};

const CONNECTION_TYPES = [
  { id: "xbox", name: "Xbox", icon: "🎮" },
  { id: "playstation", name: "PlayStation", icon: "🎮" },
  { id: "roblox", name: "Roblox", icon: "🎮" },
  { id: "spotify", name: "Spotify", icon: "🎵" },
  { id: "appleMusic", name: "Apple Music", icon: "🎵" },
  { id: "soundcloud", name: "SoundCloud", icon: "🎵" },
  { id: "youtubeMusic", name: "YouTube Music", icon: "🎵" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "facebook", name: "Facebook", icon: "📘" },
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "twitch", name: "Twitch", icon: "🎥" },
];

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function getInitials(user) {
  if (!user) return "?";

  const text =
    user.displayName ||
    user.username ||
    "User";

  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isImage(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("data:image/") ||
      /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(value))
  );
}

function safeUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {
      return url.href;
    }

    return "";
  } catch {
    return "";
  }
}

function normalizeUser(user) {
  return {
    id: user.id || uid("user"),
    username: user.username || "user",
    displayName:
      user.displayName ||
      user.username ||
      "User",
    email: user.email || "",
    password: user.password || "",
    bio: user.bio || "",
    pronouns: user.pronouns || "",
    avatar: user.avatar || "",
    banner: user.banner || "",
    status: user.status || "Online",
    statusEmoji: user.statusEmoji || "🟢",
    profileTags: Array.isArray(user.profileTags)
      ? user.profileTags
      : [],
    role: user.role || "member",
    staffBadges: Array.isArray(user.staffBadges)
      ? user.staffBadges
      : [],
    connections: user.connections || {},
    createdAt: user.createdAt || Date.now(),
  };
}

function isOwner(user) {
  return Boolean(
    user &&
      (user.role === "owner" ||
        user.staffBadges?.includes("owner"))
  );
}

function readImageFile(event, setter) {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    setter(String(reader.result || ""));
  };

  reader.readAsDataURL(file);
}

function getDefaultUsers() {
  return [
    normalizeUser({
      id: "demo-owner",
      username: "vexelowner",
      displayName: "Vexel Owner",
      email: "owner@vexel.app",
      password: "demo",
      bio: "Official creator and owner of Vexel.",
      pronouns: "they/them",
      avatar: "",
      banner: "",
      status: "Online",
      statusEmoji: "🟢",
      profileTags: ["Owner", "Developer"],
      role: "owner",
      staffBadges: ["owner", "developer"],
      createdAt: Date.now(),
      connections: {},
    }),
  ];
}

function getDefaultServers() {
  return [
    {
      id: "server-vexel",
      name: "Vexel Community",
      description:
        "The official Vexel community.",
      icon: "V",
      banner: "",
      tags: ["Community", "Gaming"],
      inviteCode: "VEXEL",
      verificationLevel: "Standard",
      ownerId: "demo-owner",
      members: ["demo-owner"],
      memberRoles: {
        "demo-owner": ["role-owner"],
      },
      roles: [
        {
          id: "role-owner",
          name: "Owner",
          color: "#f6c94d",
          permissions: [
            "Manage Server",
            "Manage Channels",
            "Manage Roles",
            "Manage Messages",
          ],
        },
        {
          id: "role-member",
          name: "Member",
          color: "#94a3b8",
          permissions: [
            "Send Messages",
            "Connect",
          ],
        },
      ],
      channels: [
        {
          id: "channel-general",
          name: "general",
          type: "text",
          topic: "Welcome to Vexel Community.",
        },
        {
          id: "channel-announcements",
          name: "announcements",
          type: "text",
          topic: "Official Vexel announcements.",
        },
        {
          id: "channel-voice",
          name: "General Voice",
          type: "voice",
          members: [],
        },
      ],
    },
  ];
}

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [users, setUsers] = useState(() =>
    loadStorage(
      STORAGE.users,
      getDefaultUsers()
    ).map(normalizeUser)
  );

  const [currentUserId, setCurrentUserId] =
    useState(() =>
      localStorage.getItem(
        STORAGE.currentUser
      )
    );

  const [servers, setServers] = useState(() =>
    loadStorage(
      STORAGE.servers,
      getDefaultServers()
    )
  );

  const [messages, setMessages] = useState(() =>
    loadStorage(STORAGE.messages, {})
  );

  const [dms, setDms] = useState(() =>
    loadStorage(STORAGE.dms, {})
  );

  const [page, setPage] = useState("home");
  const [selectedServerId, setSelectedServerId] =
    useState(null);

  const [selectedChannelId, setSelectedChannelId] =
    useState(null);

  const [selectedDmUserId, setSelectedDmUserId] =
    useState(null);

  const [profileUserId, setProfileUserId] =
    useState(null);

  const [showProfileEdit, setShowProfileEdit] =
    useState(false);

  const [showCreateServer, setShowCreateServer] =
    useState(false);

  const [showCreateChannel, setShowCreateChannel] =
    useState(false);

  const [showServerSettings, setShowServerSettings] =
    useState(false);

  const [showRoleManager, setShowRoleManager] =
    useState(false);

  const [showAdminPanel, setShowAdminPanel] =
    useState(false);

  const [showAddPeople, setShowAddPeople] =
    useState(false);

  const [showBadgeModal, setShowBadgeModal] =
    useState(false);

  const [callUser, setCallUser] =
    useState(null);

  const currentUser = users.find(
    (user) => user.id === currentUserId
  );

  const selectedServer = servers.find(
    (server) => server.id === selectedServerId
  );

  const selectedChannel =
    selectedServer?.channels?.find(
      (channel) =>
        channel.id === selectedChannelId
    );

  const selectedDmUser = users.find(
    (user) => user.id === selectedDmUserId
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE.users,
      JSON.stringify(users)
    );
  }, [users]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE.servers,
      JSON.stringify(servers)
    );
  }, [servers]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE.messages,
      JSON.stringify(messages)
    );
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE.dms,
      JSON.stringify(dms)
    );
  }, [dms]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(
        STORAGE.currentUser,
        currentUserId
      );
    } else {
      localStorage.removeItem(
        STORAGE.currentUser
      );
    }
  }, [currentUserId]);

  /* =======================================================
     AUTH
  ======================================================= */

  function login(email, password) {
    const user = users.find(
      (item) =>
        item.email.toLowerCase() ===
          email.toLowerCase() &&
        item.password === password
    );

    if (!user) {
      alert(
        "Invalid email or password."
      );
      return false;
    }

    setCurrentUserId(user.id);
    return true;
  }

  function register(data) {
    const username =
      data.username.trim().toLowerCase();

    const email =
      data.email.trim().toLowerCase();

    if (
      !username ||
      !email ||
      !data.password
    ) {
      alert(
        "Please complete all required fields."
      );
      return false;
    }

    if (
      users.some(
        (user) =>
          user.username.toLowerCase() ===
          username
      )
    ) {
      alert("That username is already taken.");
      return false;
    }

    if (
      users.some(
        (user) =>
          user.email.toLowerCase() ===
          email
      )
    ) {
      alert("That email is already registered.");
      return false;
    }

    const newUser = normalizeUser({
      id: uid("user"),
      username,
      displayName:
        data.displayName.trim() ||
        data.username.trim(),
      email,
      password: data.password,
      bio: "",
      pronouns: "",
      avatar: "",
      banner: "",
      status: "Online",
      statusEmoji: "🟢",
      profileTags: [],
      role: "member",
      staffBadges: [],
      connections: {},
      createdAt: Date.now(),
    });

    setUsers((prev) => [
      ...prev,
      newUser,
    ]);

    setCurrentUserId(newUser.id);

    return true;
  }

  function logout() {
    setCurrentUserId(null);
    setPage("home");
    setSelectedDmUserId(null);
    setSelectedServerId(null);
    setSelectedChannelId(null);
  }

  /* =======================================================
     PROFILE
  ======================================================= */

  function updateProfile(updated) {
    if (!currentUser) return;

    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id
          ? normalizeUser({
              ...user,
              ...updated,
            })
          : user
      )
    );

    setShowProfileEdit(false);
  }

  function updateStaffBadges(
    userId,
    badges
  ) {
    if (!isOwner(currentUser)) return;

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              staffBadges: badges,
              role: badges.includes("owner")
                ? "owner"
                : user.role === "owner"
                ? "member"
                : user.role,
            }
          : user
      )
    );
  }

  function openUserProfile(userId) {
    setProfileUserId(userId);
  }

  function openDm(user) {
    if (!user || user.id === currentUser?.id)
      return;

    setSelectedDmUserId(user.id);
    setPage("home");
  }

  function addDmUser(user) {
    if (!user) return;

    setSelectedDmUserId(user.id);
    setShowAddPeople(false);
    setPage("home");
  }

  /* =======================================================
     SERVERS
  ======================================================= */

  function selectServer(server) {
    setPage("server");
    setSelectedServerId(server.id);

    const firstChannel =
      server.channels?.[0];

    setSelectedChannelId(
      firstChannel?.id || null
    );

    setSelectedDmUserId(null);
  }

  function createServer(data) {
    if (!currentUser) return;

    const server = {
      id: uid("server"),
      name:
        data.name.trim() ||
        "New Server",
      description:
        data.description.trim(),
      icon: data.icon || "V",
      banner: data.banner || "",
      tags: parseTags(data.tags),
      inviteCode:
        data.inviteCode.trim() ||
        Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase(),
      verificationLevel:
        data.verificationLevel ||
        "Standard",
      ownerId: currentUser.id,
      members: [currentUser.id],
      memberRoles: {
        [currentUser.id]: [],
      },
      roles: [
        {
          id: uid("role"),
          name: "Owner",
          color: "#f6c94d",
          permissions: [
            "Manage Server",
            "Manage Channels",
            "Manage Roles",
            "Manage Messages",
          ],
        },
        {
          id: uid("role"),
          name: "Member",
          color: "#94a3b8",
          permissions: [
            "Send Messages",
            "Connect",
          ],
        },
      ],
      channels: [
        {
          id: uid("channel"),
          name: "general",
          type: "text",
          topic: "General discussion.",
        },
      ],
    };

    const ownerRole =
      server.roles.find(
        (role) => role.name === "Owner"
      );

    server.memberRoles[
      currentUser.id
    ] = ownerRole
      ? [ownerRole.id]
      : [];

    setServers((prev) => [
      ...prev,
      server,
    ]);

    setPage("server");
    setSelectedServerId(server.id);
    setSelectedChannelId(
      server.channels[0].id
    );
    setShowCreateServer(false);
  }

  function updateServer(updated) {
    if (!selectedServer) return;

    setServers((prev) =>
      prev.map((server) =>
        server.id === selectedServer.id
          ? {
              ...server,
              ...updated,
            }
          : server
      )
    );

    setShowServerSettings(false);
  }

  function deleteServer() {
    if (!selectedServer) return;

    setServers((prev) =>
      prev.filter(
        (server) =>
          server.id !== selectedServer.id
      )
    );

    setSelectedServerId(null);
    setSelectedChannelId(null);
    setPage("home");
    setShowServerSettings(false);
  }

  /* =======================================================
     CHANNELS
  ======================================================= */

  function createChannel(data) {
    if (!selectedServer) return;

    const channel = {
      id: uid("channel"),
      name:
        data.name.trim() ||
        "new-channel",
      type: data.type,
      topic:
        data.topic.trim() ||
        "",
      members: [],
    };

    setServers((prev) =>
      prev.map((server) =>
        server.id === selectedServer.id
          ? {
              ...server,
              channels: [
                ...(server.channels || []),
                channel,
              ],
            }
          : server
      )
    );

    setSelectedChannelId(channel.id);
    setShowCreateChannel(false);
  }

  /* =======================================================
     ROLES
  ======================================================= */

  function createRole(roleData) {
    if (!selectedServer) return;

    const role = {
      id: uid("role"),
      name:
        roleData.name.trim() ||
        "New Role",
      color:
        roleData.color ||
        "#94a3b8",
      permissions:
        roleData.permissions || [],
    };

    setServers((prev) =>
      prev.map((server) =>
        server.id === selectedServer.id
          ? {
              ...server,
              roles: [
                ...(server.roles || []),
                role,
              ],
            }
          : server
      )
    );
  }

  function updateRole(
    roleId,
    changes
  ) {
    if (!selectedServer) return;

    setServers((prev) =>
      prev.map((server) =>
        server.id === selectedServer.id
          ? {
              ...server,
              roles: server.roles.map(
                (role) =>
                  role.id === roleId
                    ? {
                        ...role,
                        ...changes,
                      }
                    : role
              ),
            }
          : server
      )
    );
  }

  function deleteRole(roleId) {
    if (!selectedServer) return;

    const role =
      selectedServer.roles?.find(
        (item) => item.id === roleId
      );

    if (
      role?.name?.toLowerCase() ===
      "owner"
    ) {
      alert(
        "The Owner role cannot be deleted."
      );
      return;
    }

    setServers((prev) =>
      prev.map((server) => {
        if (
          server.id !==
          selectedServer.id
        ) {
          return server;
        }

        const memberRoles = {
          ...(server.memberRoles || {}),
        };

        Object.keys(memberRoles).forEach(
          (memberId) => {
            memberRoles[memberId] =
              memberRoles[
                memberId
              ].filter(
                (id) =>
                  id !== roleId
              );
          }
        );

        return {
          ...server,
          roles:
            server.roles.filter(
              (item) =>
                item.id !== roleId
            ),
          memberRoles,
        };
      })
    );
  }

  function toggleMemberRole(
    memberId,
    roleId
  ) {
    if (!selectedServer) return;

    setServers((prev) =>
      prev.map((server) => {
        if (
          server.id !==
          selectedServer.id
        ) {
          return server;
        }

        const role =
          server.roles?.find(
            (item) =>
              item.id === roleId
          );

        if (
          role?.name?.toLowerCase() ===
            "owner" &&
          memberId ===
            server.ownerId
        ) {
          return server;
        }

        const memberRoles = {
          ...(server.memberRoles || {}),
        };

        const existing =
          memberRoles[memberId] || [];

        memberRoles[memberId] =
          existing.includes(roleId)
            ? existing.filter(
                (id) =>
                  id !== roleId
              )
            : [
                ...existing,
                roleId,
              ];

        return {
          ...server,
          memberRoles,
        };
      })
    );
  }

  /* =======================================================
     MESSAGES
  ======================================================= */

  function sendMessage(text) {
    const value = text.trim();

    if (
      !value ||
      !selectedServer ||
      !selectedChannel ||
      selectedChannel.type !== "text" ||
      !currentUser
    ) {
      return;
    }

    const key =
      `${selectedServer.id}:` +
      `${selectedChannel.id}`;

    const message = {
      id: uid("message"),
      authorId: currentUser.id,
      text: value,
      createdAt: Date.now(),
    };

    setMessages((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] || []),
        message,
      ],
    }));
  }

  function sendDm(text) {
    const value = text.trim();

    if (
      !value ||
      !currentUser ||
      !selectedDmUser
    ) {
      return;
    }

    const key = dmKey(
      currentUser.id,
      selectedDmUser.id
    );

    const message = {
      id: uid("dm"),
      senderId: currentUser.id,
      text: value,
      createdAt: Date.now(),
    };

    setDms((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] || []),
        message,
      ],
    }));
  }

  function dmKey(a, b) {
    return [a, b].sort().join(":");
  }

  /* =======================================================
     AUTH SCREEN
  ======================================================= */

  if (!currentUser) {
    return (
      <>
        <AuthScreen
          onLogin={login}
          onRegister={register}
        />
        <GlobalStyles />
      </>
    );
  }

  return (
    <>
      <div className="app">
        <ServerBar
          servers={servers}
          currentUser={currentUser}
          page={page}
          selectedServerId={
            selectedServerId
          }
          onHome={() => {
            setPage("home");
            setSelectedDmUserId(
              null
            );
            setSelectedServerId(null);
            setSelectedChannelId(null);
          }}
          onSelectServer={
            selectServer
          }
          onCreateServer={() =>
            setShowCreateServer(true)
          }
          onAdmin={() =>
            setShowAdminPanel(true)
          }
          onProfile={() =>
            setProfileUserId(
              currentUser.id
            )
          }
        />

        {page === "home" ? (
          <>
            <HomeSidebar
              users={users}
              currentUser={currentUser}
              selectedDmUserId={
                selectedDmUserId
              }
              onAddPeople={() =>
                setShowAddPeople(true)
              }
              onOpenDm={openDm}
              onProfile={
                openUserProfile
              }
              onLogout={logout}
            />

            <HomePage
              currentUser={currentUser}
              user={selectedDmUser}
              messages={
                selectedDmUser
                  ? dms[
                      dmKey(
                        currentUser.id,
                        selectedDmUser.id
                      )
                    ] || []
                  : []
              }
              users={users}
              onSend={sendDm}
              onProfile={
                openUserProfile
              }
              onCall={() =>
                selectedDmUser &&
                setCallUser(
                  selectedDmUser
                )
              }
            />
          </>
        ) : (
          <>
            <ServerSidebar
              server={selectedServer}
              currentUser={currentUser}
              onSelectChannel={(channel) =>
                setSelectedChannelId(
                  channel.id
                )
              }
              selectedChannelId={
                selectedChannelId
              }
              onCreateChannel={() =>
                setShowCreateChannel(true)
              }
              onSettings={() =>
                setShowServerSettings(true)
              }
              onProfile={
                openUserProfile
              }
            />

            <ServerPage
              server={selectedServer}
              channel={selectedChannel}
              currentUser={currentUser}
              users={users}
              messages={
                selectedServer &&
                selectedChannel
                  ? messages[
                      `${selectedServer.id}:${selectedChannel.id}`
                    ] || []
                  : []
              }
              onSend={sendMessage}
              onProfile={
                openUserProfile
              }
            />
          </>
        )}
      </div>

      {profileUserId && (
        <ProfileModal
          user={users.find(
            (item) =>
              item.id ===
              profileUserId
          )}
          currentUser={currentUser}
          servers={servers}
          onClose={() =>
            setProfileUserId(null)
          }
          onEdit={() =>
            setShowProfileEdit(true)
          }
          onDm={(user) => {
            openDm(user);
            setProfileUserId(null);
          }}
          onCall={(user) => {
            setCallUser(user);
            setProfileUserId(null);
          }}
          onManageBadges={() =>
            setShowBadgeModal(true)
          }
        />
      )}

      {showProfileEdit && (
        <ProfileEditModal
          user={currentUser}
          onClose={() =>
            setShowProfileEdit(false)
          }
          onSave={updateProfile}
        />
      )}

      {showCreateServer && (
        <CreateServerModal
          onClose={() =>
            setShowCreateServer(false)
          }
          onCreate={createServer}
        />
      )}

      {showCreateChannel &&
        selectedServer && (
          <CreateChannelModal
            onClose={() =>
              setShowCreateChannel(false)
            }
            onCreate={createChannel}
          />
        )}

      {showServerSettings &&
        selectedServer && (
          <ServerSettingsModal
            server={selectedServer}
            currentUser={currentUser}
            onClose={() =>
              setShowServerSettings(
                false
              )
            }
            onSave={updateServer}
            onDelete={deleteServer}
            onRoles={() =>
              setShowRoleManager(true)
            }
          />
        )}

      {showRoleManager &&
        selectedServer && (
          <RoleManagerModal
            server={selectedServer}
            users={users}
            onClose={() =>
              setShowRoleManager(false)
            }
            onCreateRole={createRole}
            onUpdateRole={
              updateRole
            }
            onDeleteRole={
              deleteRole
            }
            onToggleMemberRole={
              toggleMemberRole
            }
          />
        )}

      {showAdminPanel &&
        isOwner(currentUser) && (
          <AdminPanel
            users={users}
            currentUser={currentUser}
            onClose={() =>
              setShowAdminPanel(false)
            }
            onManageUser={(user) => {
              setProfileUserId(
                user.id
              );
              setShowAdminPanel(
                false
              );
            }}
          />
        )}

      {showAddPeople && (
        <AddPeopleModal
          users={users}
          currentUser={currentUser}
          onClose={() =>
            setShowAddPeople(false)
          }
          onSelect={addDmUser}
        />
      )}

      {showBadgeModal &&
        profileUserId && (
          <BadgeModal
            user={users.find(
              (item) =>
                item.id ===
                profileUserId
            )}
            onClose={() =>
              setShowBadgeModal(false)
            }
            onSave={(badges) => {
              updateStaffBadges(
                profileUserId,
                badges
              );
              setShowBadgeModal(false);
            }}
          />
        )}

      {callUser && (
        <PrivateCallModal
          user={callUser}
          onClose={() =>
            setCallUser(null)
          }
        />
      )}

      <GlobalStyles />
    </>
  );
}

/* =========================================================
   AUTH
========================================================= */

function AuthScreen({
  onLogin,
  onRegister,
}) {
  const [mode, setMode] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [displayName, setDisplayName] =
    useState("");

  function submit(event) {
    event.preventDefault();

    if (mode === "login") {
      onLogin(email, password);
      return;
    }

    onRegister({
      username,
      displayName,
      email,
      password,
    });
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          V
        </div>

        <h1>
          Welcome to Vexel
        </h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to your Vexel account."
            : "Create your Vexel account."}
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Username
              </label>

              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="username"
                required
              />

              <label>
                Display Name
              </label>

              <input
                value={displayName}
                onChange={(e) =>
                  setDisplayName(
                    e.target.value
                  )
                }
                placeholder="Display name"
              />
            </>
          )}

          <label>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="you@example.com"
            required
          />

          <label>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Password"
            required
          />

          <button className="primary-button">
            {mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() =>
            setMode(
              mode === "login"
                ? "register"
                : "login"
            )
          }
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>

        <div className="demo-login">
          Demo account: owner@vexel.app /
          demo
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SERVER BAR
========================================================= */

function ServerBar({
  servers,
  currentUser,
  page,
  selectedServerId,
  onHome,
  onSelectServer,
  onCreateServer,
  onAdmin,
  onProfile,
}) {
  return (
    <aside className="server-bar">
      <button
        className={`home-button ${
          page === "home"
            ? "active"
            : ""
        }`}
        onClick={onHome}
        title="Home"
      >
        V
      </button>

      <div className="server-divider" />

      {servers.map((server) => (
        <button
          key={server.id}
          className={`server-icon ${
            selectedServerId ===
            server.id
              ? "active"
              : ""
          }`}
          onClick={() =>
            onSelectServer(server)
          }
          title={server.name}
        >
          {isImage(server.icon) ? (
            <img
              src={server.icon}
              alt=""
              className="server-icon-image"
            />
          ) : (
            server.icon || "S"
          )}
        </button>
      ))}

      <button
        className="add-server-button"
        onClick={onCreateServer}
        title="Create Server"
      >
        +
      </button>

      <div className="server-bar-spacer" />

      {isOwner(currentUser) && (
        <button
          className="admin-icon-button"
          onClick={onAdmin}
          title="Owner Panel"
        >
          🛡️
        </button>
      )}

      <button
        className="user-server-button"
        onClick={onProfile}
        title="My Profile"
      >
        <Avatar
          user={currentUser}
          small
        />
      </button>
    </aside>
  );
}

/* =========================================================
   HOME SIDEBAR
========================================================= */

function HomeSidebar({
  users,
  currentUser,
  selectedDmUserId,
  onAddPeople,
  onOpenDm,
  onProfile,
  onLogout,
}) {
  const people = users.filter(
    (user) =>
      user.id !== currentUser.id
  );

  return (
    <aside className="channel-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-main">
          <div className="brand-small">
            VEXEL
          </div>

          <div className="sidebar-title">
            Home
          </div>
        </div>

        <button
          className="icon-button"
          onClick={onAddPeople}
          title="Add People"
        >
          +
        </button>
      </div>

      <div className="home-actions">
        <button
          className="sidebar-main-button active"
        >
          💬 Direct Messages
        </button>

        <button
          className="sidebar-main-button"
          onClick={onAddPeople}
        >
          👥 Add People
        </button>
      </div>

      <div className="section-label">
        DIRECT MESSAGES
      </div>

      <div className="dm-list">
        {people.length === 0 ? (
          <div className="empty-sidebar">
            No other Vexel users yet.
          </div>
        ) : (
          people.map((user) => (
            <button
              key={user.id}
              className={`dm-user ${
                selectedDmUserId ===
                user.id
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                onOpenDm(user)
              }
              onContextMenu={(event) => {
                event.preventDefault();
                onProfile(user.id);
              }}
            >
              <Avatar
                user={user}
                small
              />

              <div className="dm-user-info">
                <strong>
                  {user.displayName}
                </strong>

                <span>
                  @{user.username}
                </span>
              </div>

              <span className="presence-dot" />
            </button>
          ))
        )}
      </div>

      <div className="sidebar-bottom">
        <button
          className="sidebar-main-button"
          onClick={() =>
            onProfile(
              currentUser.id
            )
          }
        >
          👤 My Profile
        </button>

        <button
          className="sidebar-main-button"
          onClick={onLogout}
        >
          🚪 Log Out
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   SERVER SIDEBAR
========================================================= */

function ServerSidebar({
  server,
  currentUser,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onSettings,
  onProfile,
}) {
  if (!server) {
    return (
      <aside className="channel-sidebar">
        <div className="empty-sidebar">
          Server not found.
        </div>
      </aside>
    );
  }

  const owner =
    server.ownerId === currentUser.id;

  const textChannels =
    server.channels?.filter(
      (channel) =>
        channel.type === "text"
    ) || [];

  const voiceChannels =
    server.channels?.filter(
      (channel) =>
        channel.type === "voice"
    ) || [];

  return (
    <aside className="channel-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-main">
          <div className="brand-small">
            SERVER
          </div>

          <div className="sidebar-title">
            {server.name}
          </div>

          {server.banner && (
            <div
              className="server-mini-banner"
              style={{
                backgroundImage: `url("${server.banner}")`,
              }}
            />
          )}

          {server.description && (
            <div className="server-description-small">
              {server.description}
            </div>
          )}
        </div>

        {owner && (
          <button
            className="icon-button"
            onClick={onSettings}
            title="Server Settings"
          >
            ⚙️
          </button>
        )}
      </div>

      <div className="section-row">
        <div className="section-label">
          TEXT CHANNELS
        </div>

        {owner && (
          <button
            className="tiny-add"
            onClick={onCreateChannel}
          >
            +
          </button>
        )}
      </div>

      <div className="channel-list">
        {textChannels.map(
          (channel) => (
            <button
              key={channel.id}
              className={`channel-item ${
                selectedChannelId ===
                channel.id
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                onSelectChannel(
                  channel
                )
              }
            >
              <span>#</span>
              {channel.name}
            </button>
          )
        )}
      </div>

      <div className="section-row">
        <div className="section-label">
          VOICE CHANNELS
        </div>

        {owner && (
          <button
            className="tiny-add"
            onClick={onCreateChannel}
          >
            +
          </button>
        )}
      </div>

      <div className="channel-list">
        {voiceChannels.map(
          (channel) => (
            <button
              key={channel.id}
              className={`channel-item ${
                selectedChannelId ===
                channel.id
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                onSelectChannel(
                  channel
                )
              }
            >
              <span>🔊</span>
              {channel.name}

              {channel.members?.length >
                0 && (
                <small>
                  {channel.members.length}
                </small>
              )}
            </button>
          )
        )}
      </div>

      <div className="sidebar-bottom">
        <button
          className="sidebar-main-button"
          onClick={() =>
            onProfile(
              currentUser.id
            )
          }
        >
          👤 Profile
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

function HomePage({
  currentUser,
  user,
  messages,
  users,
  onSend,
  onProfile,
  onCall,
}) {
  if (!user) {
    return (
      <main className="main">
        <div className="main-header">
          <div>
            <div className="channel-title">
              Home
            </div>

            <div className="channel-topic">
              Your private Vexel space
            </div>
          </div>
        </div>

        <div className="home-empty">
          <div className="home-empty-logo">
            V
          </div>

          <h1>
            Welcome to Vexel
          </h1>

          <p>
            Select a direct message from
            the left side or use Add People
            to find someone by their
            @username.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="main-header">
        <button
          className="main-header-user"
          onClick={() =>
            onProfile(user.id)
          }
        >
          <Avatar
            user={user}
            small
          />

          <div>
            <strong>
              {user.displayName}
            </strong>

            <span>
              @{user.username}
            </span>
          </div>
        </button>

        <div className="main-header-actions">
          <button
            className="header-action"
            onClick={onCall}
            title="Private Call"
          >
            📞
          </button>
        </div>
      </div>

      <MessageList
        messages={messages}
        users={users}
        onProfile={onProfile}
        emptyTitle={`Message ${user.displayName}`}
        emptyText="Start a private conversation."
      />

      <MessageComposer
        placeholder={`Message @${user.username}`}
        onSend={onSend}
      />
    </main>
  );
}

/* =========================================================
   SERVER PAGE
========================================================= */

function ServerPage({
  server,
  channel,
  currentUser,
  users,
  messages,
  onSend,
  onProfile,
}) {
  if (!server || !channel) {
    return (
      <main className="main">
        <div className="home-empty">
          <h1>
            Select a channel
          </h1>
        </div>
      </main>
    );
  }

  if (channel.type === "voice") {
    return (
      <VoiceChannel
        channel={channel}
        currentUser={currentUser}
        users={users}
        onProfile={onProfile}
      />
    );
  }

  return (
    <main className="main">
      <div className="main-header">
        <div>
          <div className="channel-title">
            <span>#</span>
            {channel.name}
          </div>

          {channel.topic && (
            <div className="channel-topic">
              {channel.topic}
            </div>
          )}
        </div>

        <div className="main-header-user">
          <Avatar
            user={currentUser}
            small
          />

          <div>
            <strong>
              {currentUser.displayName}
            </strong>

            <span>
              @{currentUser.username}
            </span>
          </div>
        </div>
      </div>

      <MessageList
        messages={messages}
        users={users}
        onProfile={onProfile}
        emptyTitle={`Welcome to #${channel.name}`}
        emptyText="This is the beginning of this channel."
      />

      <MessageComposer
        placeholder={`Message #${channel.name}`}
        onSend={onSend}
      />
    </main>
  );
}

/* =========================================================
   MESSAGE LIST
========================================================= */

function MessageList({
  messages,
  users,
  onProfile,
  emptyTitle,
  emptyText,
}) {
  if (!messages.length) {
    return (
      <div className="messages">
        <div className="chat-empty">
          <h2>
            {emptyTitle}
          </h2>

          <p>
            {emptyText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages">
      {messages.map((message) => {
        const user =
          users.find(
            (item) =>
              item.id ===
              (message.authorId ||
                message.senderId)
          ) || null;

        return (
          <div
            className="message"
            key={message.id}
          >
            <button
              className="message-avatar-button"
              onClick={() =>
                user &&
                onProfile(user.id)
              }
            >
              <Avatar
                user={user}
                small
              />
            </button>

            <div className="message-body">
              <div className="message-author-row">
                <button
                  className="message-author"
                  onClick={() =>
                    user &&
                    onProfile(
                      user.id
                    )
                  }
                >
                  {user?.displayName ||
                    "Unknown User"}
                </button>

                <span className="message-time">
                  {new Date(
                    message.createdAt
                  ).toLocaleTimeString(
                    [],
                    {
                      hour: "numeric",
                      minute: "2-digit",
                    }
                  )}
                </span>

                {user?.staffBadges?.map(
                  (badge) => (
                    <StaffBadge
                      key={badge}
                      badge={badge}
                      compact
                    />
                  )
                )}
              </div>

              <div className="message-text">
                {message.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   MESSAGE COMPOSER
========================================================= */

function MessageComposer({
  placeholder,
  onSend,
}) {
  const [text, setText] =
    useState("");

  function submit(event) {
    event.preventDefault();

    if (!text.trim()) return;

    onSend(text);
    setText("");
  }

  return (
    <form
      className="message-composer"
      onSubmit={submit}
    >
      <input
        value={text}
        onChange={(e) =>
          setText(e.target.value)
        }
        placeholder={placeholder}
      />

      <button
        className="send-button"
        type="submit"
      >
        ➤
      </button>
    </form>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
  user,
  small = false,
  tiny = false,
}) {
  if (!user) {
    return (
      <div className="avatar-wrap">
        <div
          className={`avatar ${
            small ? "small" : ""
          } ${tiny ? "tiny" : ""}`}
        >
          ?
        </div>
      </div>
    );
  }

  return (
    <div className="avatar-wrap">
      {isImage(user.avatar) ? (
        <img
          src={user.avatar}
          alt=""
          className={`avatar ${
            small ? "small" : ""
          } ${tiny ? "tiny" : ""}`}
        />
      ) : (
        <div
          className={`avatar ${
            small ? "small" : ""
          } ${tiny ? "tiny" : ""}`}
        >
          {getInitials(user)}
        </div>
      )}

      <span
        className={`avatar-status ${
          user.status === "Away"
            ? "away"
            : user.status ===
              "Offline"
            ? "offline"
            : ""
        }`}
      />
    </div>
  );
}

/* =========================================================
   STAFF BADGE
========================================================= */

function StaffBadge({
  badge,
  compact = false,
}) {
  const data =
    STAFF_BADGES[badge];

  if (!data) return null;

  return (
    <span
      className={`staff-badge ${
        compact ? "compact" : ""
      }`}
      title={data.description}
    >
      {data.icon} {data.name}
    </span>
  );
}

/* =========================================================
   PROFILE MODAL
========================================================= */

function ProfileModal({
  user,
  currentUser,
  servers,
  onClose,
  onEdit,
  onDm,
  onCall,
  onManageBadges,
}) {
  if (!user) return null;

  const canEdit =
    user.id === currentUser.id;

  const canManageBadges =
    isOwner(currentUser);

  const serverRoles = [];

  servers.forEach((server) => {
    const roleIds =
      server.memberRoles?.[
        user.id
      ] || [];

    roleIds.forEach((roleId) => {
      const role =
        server.roles?.find(
          (item) =>
            item.id === roleId
        );

      if (role) {
        serverRoles.push({
          ...role,
          serverName:
            server.name,
        });
      }
    });
  });

  return (
    <div className="modal-backdrop">
      <div className="profile-modal">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div
          className="profile-banner"
          style={
            isImage(user.banner)
              ? {
                  backgroundImage: `url("${user.banner}")`,
                }
              : undefined
          }
        />

        <div className="profile-header">
          <Avatar user={user} />

          <div className="profile-name-area">
            <h1>
              {user.displayName}
            </h1>

            <div className="profile-username">
              @{user.username}
            </div>

            <div className="profile-status">
              {user.statusEmoji}{" "}
              {user.status}
            </div>
          </div>
        </div>

        <div className="profile-content">
          {user.pronouns && (
            <div className="profile-section">
              <div className="profile-section-title">
                PRONOUNS
              </div>

              <p className="profile-bio">
                {user.pronouns}
              </p>
            </div>
          )}

          {user.bio && (
            <div className="profile-section">
              <div className="profile-section-title">
                ABOUT ME
              </div>

              <p className="profile-bio">
                {user.bio}
              </p>
            </div>
          )}

          {user.profileTags?.length >
            0 && (
            <div className="profile-section">
              <div className="profile-section-title">
                PROFILE TAGS
              </div>

              <div className="profile-tags">
                {user.profileTags.map(
                  (tag) => (
                    <span
                      className="profile-tag"
                      key={tag}
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {user.staffBadges?.length >
            0 && (
            <div className="profile-section">
              <div className="profile-section-title">
                VEXEL STAFF
              </div>

              <div className="staff-badge-list">
                {user.staffBadges.map(
                  (badge) => (
                    <button
                      key={badge}
                      className="badge-button"
                      onClick={() =>
                        alert(
                          STAFF_BADGES[
                            badge
                          ]?.description ||
                            "Verified Vexel staff badge."
                        )
                      }
                    >
                      <StaffBadge
                        badge={badge}
                      />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {serverRoles.length >
            0 && (
            <div className="profile-section">
              <div className="profile-section-title">
                SERVER ROLES
              </div>

              <div className="profile-tags">
                {serverRoles.map(
                  (role, index) => (
                    <RoleBadge
                      role={role}
                      key={`${role.id}-${index}`}
                    />
                  )
                )}
              </div>
            </div>
          )}

          <div className="profile-section">
            <div className="profile-section-title">
              CONNECTIONS
            </div>

            <div className="connections-grid">
              {CONNECTION_TYPES.filter(
                (type) =>
                  user.connections?.[
                    type.id
                  ]
              ).map((type) => (
                <Connection
                  key={type.id}
                  type={type}
                  value={
                    user.connections[
                      type.id
                    ]
                  }
                />
              ))}
            </div>

            {!CONNECTION_TYPES.some(
              (type) =>
                user.connections?.[
                  type.id
                ]
            ) && (
              <p className="connection-help">
                No connections added.
              </p>
            )}
          </div>

          <div className="profile-section">
            <div className="profile-section-title">
              MEMBER SINCE
            </div>

            <p className="profile-bio">
              {new Date(
                user.createdAt
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="profile-actions">
          {!canEdit && (
            <>
              <button
                className="primary-button"
                onClick={() =>
                  onDm(user)
                }
              >
                💬 Message
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  onCall(user)
                }
              >
                📞 Private Call
              </button>
            </>
          )}

          {canEdit && (
            <button
              className="primary-button"
              onClick={onEdit}
            >
              ✏️ Edit Profile
            </button>
          )}

          {canManageBadges && (
            <button
              className="secondary-button"
              onClick={onManageBadges}
            >
              🛡️ Manage Vexel Staff Badges
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CONNECTION
========================================================= */

function Connection({
  type,
  value,
}) {
  const url = safeUrl(value);

  if (!url) {
    return (
      <div className="connection-card">
        <strong>
          {type.icon}{" "}
          {type.name}
        </strong>

        <small>
          {value}
        </small>
      </div>
    );
  }

  return (
    <a
      className="connection-card"
      href={url}
      target="_blank"
      rel="noreferrer"
    >
      <strong>
        {type.icon}{" "}
        {type.name}
      </strong>

      <small>
        Connected
      </small>
    </a>
  );
}

/* =========================================================
   PROFILE EDIT
========================================================= */

function ProfileEditModal({
  user,
  onClose,
  onSave,
}) {
  const [username, setUsername] =
    useState(user.username);

  const [displayName, setDisplayName] =
    useState(user.displayName);

  const [bio, setBio] =
    useState(user.bio);

  const [pronouns, setPronouns] =
    useState(user.pronouns);

  const [avatar, setAvatar] =
    useState(user.avatar);

  const [banner, setBanner] =
    useState(user.banner);

  const [status, setStatus] =
    useState(user.status);

  const [statusEmoji, setStatusEmoji] =
    useState(user.statusEmoji);

  const [tags, setTags] =
    useState(
      user.profileTags.join(", ")
    );

  const [connections, setConnections] =
    useState(
      user.connections || {}
    );

  function save(event) {
    event.preventDefault();

    onSave({
      username:
        username
          .trim()
          .toLowerCase() ||
        user.username,

      displayName:
        displayName.trim() ||
        user.displayName,

      bio: bio.trim(),

      pronouns:
        pronouns.trim(),

      avatar,

      banner,

      status,

      statusEmoji,

      profileTags:
        parseTags(tags),

      connections,
    });
  }

  function updateConnection(
    id,
    value
  ) {
    setConnections((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  return (
    <div className="modal-backdrop">
      <div className="edit-profile-modal">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>
          Edit Profile
        </h2>

        <p className="modal-description">
          Customize your Vexel profile.
        </p>

        <form onSubmit={save}>
          <div className="edit-profile-preview">
            <div
              className="edit-banner-preview"
              style={
                isImage(banner)
                  ? {
                      backgroundImage: `url("${banner}")`,
                    }
                  : undefined
              }
            />

            <Avatar
              user={{
                ...user,
                avatar,
                displayName,
                username,
                status,
                statusEmoji,
              }}
            />
          </div>

          <label>
            Username
          </label>

          <input
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
          />

          <label>
            Display Name
          </label>

          <input
            value={displayName}
            onChange={(e) =>
              setDisplayName(
                e.target.value
              )
            }
          />

          <label>
            Avatar URL
          </label>

          <input
            value={avatar}
            placeholder="https://..."
            onChange={(e) =>
              setAvatar(
                e.target.value
              )
            }
          />

          <label>
            Upload Avatar
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              readImageFile(
                e,
                setAvatar
              )
            }
          />

          <label>
            Banner URL
          </label>

          <input
            value={banner}
            placeholder="https://..."
            onChange={(e) =>
              setBanner(
                e.target.value
              )
            }
          />

          <label>
            Upload Banner
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              readImageFile(
                e,
                setBanner
              )
            }
          />

          <label>
            Bio
          </label>

          <textarea
            className="profile-textarea"
            value={bio}
            onChange={(e) =>
              setBio(
                e.target.value
              )
            }
            placeholder="Tell people about yourself..."
          />

          <div className="two-column">
            <div>
              <label>
                Pronouns
              </label>

              <input
                value={pronouns}
                onChange={(e) =>
                  setPronouns(
                    e.target.value
                  )
                }
                placeholder="they/them"
              />
            </div>

            <div>
              <label>
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
              >
                <option>
                  Online
                </option>

                <option>
                  Away
                </option>

                <option>
                  Offline
                </option>
              </select>
            </div>
          </div>

          <label>
            Status Emoji
          </label>

          <input
            value={statusEmoji}
            onChange={(e) =>
              setStatusEmoji(
                e.target.value
              )
            }
            placeholder="🟢"
          />

          <label>
            Profile Tags
          </label>

          <input
            value={tags}
            onChange={(e) =>
              setTags(
                e.target.value
              )
            }
            placeholder="Gaming, Developer, Roblox"
          />

          <div className="edit-section-title">
            CONNECTIONS
          </div>

          <div className="connection-edit-grid">
            {CONNECTION_TYPES.map(
              (type) => (
                <div
                  className="connection-edit"
                  key={type.id}
                >
                  <div className="connection-edit-title">
                    {type.icon}
                    <strong>
                      {type.name}
                    </strong>
                  </div>

                  <input
                    value={
                      connections[
                        type.id
                      ] || ""
                    }
                    onChange={(e) =>
                      updateConnection(
                        type.id,
                        e.target.value
                      )
                    }
                    placeholder={
                      type.name +
                      " URL or username"
                    }
                  />
                </div>
              )
            )}
          </div>

          <button className="primary-button">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   STAFF BADGE MANAGER
========================================================= */

function BadgeModal({
  user,
  onClose,
  onSave,
}) {
  const [badges, setBadges] =
    useState(
      user?.staffBadges || []
    );

  function toggle(id) {
    setBadges((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id]
    );
  }

  if (!user) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>
          Vexel Staff Badges
        </h2>

        <p className="modal-description">
          Official Vexel badges can only be
          assigned by the official owner.
        </p>

        <div className="badge-manager">
          {Object.entries(
            STAFF_BADGES
          ).map(
            ([id, badge]) => (
              <label
                className="badge-check"
                key={id}
              >
                <input
                  type="checkbox"
                  checked={badges.includes(
                    id
                  )}
                  onChange={() =>
                    toggle(id)
                  }
                />

                <StaffBadge badge={id} />

                <span>
                  {badge.description}
                </span>
              </label>
            )
          )}
        </div>

        <button
          className="primary-button"
          onClick={() =>
            onSave(badges)
          }
        >
          Save Official Badges
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   CREATE SERVER
========================================================= */

function CreateServerModal({
  onClose,
  onCreate,
}) {
  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [icon, setIcon] =
    useState("V");

  const [banner, setBanner] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [inviteCode, setInviteCode] =
    useState("");

  const [
    verificationLevel,
    setVerificationLevel,
  ] = useState("Standard");

  function submit(event) {
    event.preventDefault();

    if (!name.trim()) {
      alert(
        "Please enter a server name."
      );
      return;
    }

    onCreate({
      name,
      description,
      icon,
      banner,
      tags,
      inviteCode,
      verificationLevel,
    });
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card large-modal">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>
          Create a Server
        </h2>

        <p className="modal-description">
          Build your own Vexel community.
        </p>

        <form onSubmit={submit}>
          <label>
            Server Name
          </label>

          <input
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            placeholder="My Community"
            required
          />

          <label>
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="What is this server about?"
          />

          <label>
            Server Icon
          </label>

          <input
            value={icon}
            onChange={(e) =>
              setIcon(
                e.target.value
              )
            }
            placeholder="V or image URL"
          />

          <label>
            Upload Server Icon
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              readImageFile(
                e,
                setIcon
              )
            }
          />

          <label>
            Server Banner URL
          </label>

          <input
            value={banner}
            onChange={(e) =>
              setBanner(
                e.target.value
              )
            }
            placeholder="https://..."
          />

          <label>
            Upload Server Banner
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              readImageFile(
                e,
                setBanner
              )
            }
          />

          <label>
            Server Tags
          </label>

          <input
            value={tags}
            onChange={(e) =>
              setTags(
                e.target.value
              )
            }
            placeholder="Gaming, Community"
          />

          <label>
            Invite Code
          </label>

          <input
            value={inviteCode}
            onChange={(e) =>
              setInviteCode(
                e.target.value
              )
            }
            placeholder="Optional"
          />

          <label>
            Verification Level
          </label>

          <select
            value={
              verificationLevel
            }
            onChange={(e) =>
              setVerificationLevel(
                e.target.value
              )
            }
          >
            <option>
              Standard
            </option>

            <option>
              High
            </option>

            <option>
              Maximum
            </option>
          </select>

          <button className="primary-button">
            Create Server
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   CREATE CHANNEL
========================================================= */

function CreateChannelModal({
  onClose,
  onCreate,
}) {
  const [name, setName] =
    useState("");

  const [type, setType] =
    useState("text");

  const [topic, setTopic] =
    useState("");

  function submit(event) {
    event.preventDefault();

    if (!name.trim()) {
      alert(
        "Please enter a channel name."
      );
      return;
    }

    onCreate({
      name,
      type,
      topic,
    });
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>
          Create Channel
        </h2>

        <form onSubmit={submit}>
          <label>
            Channel Name
          </label>

          <input
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            placeholder="general"
            required
          />

          <label>
            Channel Type
          </label>

          <select
            value={type}
            onChange={(e) =>
              setType(
                e.target.value
              )
            }
          >
            <option value="text">
              Text
            </option>

            <option value="voice">
              Voice
            </option>
          </select>

          {type === "text" && (
            <>
              <label>
                Channel Topic
              </label>

              <input
                value={topic}
                onChange={(e) =>
                  setTopic(
                    e.target.value
                  )
                }
                placeholder="Channel topic"
              />
            </>
          )}

          <button className="primary-button">
            Create Channel
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   SERVER SETTINGS
========================================================= */

function ServerSettingsModal({
  server,
  currentUser,
  onClose,
  onSave,
  onDelete,
  onRoles,
}) {
  const [name, setName] =
    useState(server.name);

  const [description, setDescription] =
    useState(server.description);

  const [icon, setIcon] =
    useState(server.icon);

  const [banner, setBanner] =
    useState(server.banner);

  const [tags, setTags] =
    useState(
      server.tags?.join(", ") ||
        ""
    );

  const [inviteCode, setInviteCode] =
    useState(
      server.inviteCode || ""
    );

  const [
    verificationLevel,
    setVerificationLevel,
  ] = useState(
    server.verificationLevel ||
      "Standard"
  );

  function save(event) {
    event.preventDefault();

    onSave({
      name:
        name.trim() ||
        server.name,

      description:
        description.trim(),

      icon,

      banner,

      tags: parseTags(tags),

      inviteCode:
        inviteCode.trim(),

      verificationLevel,
    });
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card large-modal">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>
          Server Settings
        </h2>

        <p className="modal-description">
          Customize {server.name}.
        </p>

        <form onSubmit={save}>
          <label>
            Server Name
          </label>

          <input
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
          />

          <label>
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />

          <label>
            Server Icon URL
          </label>

          <input
            value={icon}
            onChange={(e) =>
              setIcon(
                e.target.value
              )
            }
          />

          <label>
            Upload New Icon
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              readImageFile(
                e,
                setIcon
              )
            }
          />

          <label>
            Server Banner URL
          </label>

          <input
            value={banner}
            onChange={(e) =>
              setBanner(
                e.target.value
              )
            }
          />

          <label>
            Upload New Banner
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              readImageFile(
                e,
                setBanner
              )
            }
          />

          <label>
            Server Tags
          </label>

          <input
            value={tags}
            onChange={(e) =>
              setTags(
                e.target.value
              )
            }
          />

          <label>
            Invite Code
          </label>

          <input
            value={inviteCode}
            onChange={(e) =>
              setInviteCode(
                e.target.value
              )
            }
          />

          <label>
            Verification Level
          </label>

          <select
            value={
              verificationLevel
            }
            onChange={(e) =>
              setVerificationLevel(
                e.target.value
              )
            }
          >
            <option>
              Standard
            </option>

            <option>
              High
            </option>

            <option>
              Maximum
            </option>
          </select>

          <div className="settings-info">
            <strong>
              Server Owner
            </strong>

            <span>
              {currentUser.displayName}
            </span>
          </div>

          <div className="settings-info">
            <strong>
              Members
            </strong>

            <span>
              {server.members?.length ||
                0}
            </span>
          </div>

          <div className="settings-info">
            <strong>
              Roles
            </strong>

            <div className="settings-role-list">
              {server.roles?.map(
                (role) => (
                  <RoleBadge
                    key={role.id}
                    role={role}
                  />
                )
              )}
            </div>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={onRoles}
          >
            🛡️ Manage Roles
          </button>

          <button className="primary-button">
            Save Changes
          </button>

          <button
            type="button"
            className="danger-button"
            onClick={() => {
              if (
                window.confirm(
                  "Delete this server?"
                )
              ) {
                onDelete();
              }
            }}
          >
            Delete Server
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   ROLE BADGE
========================================================= */

function RoleBadge({
  role,
}) {
  if (!role) return null;

  return (
    <span
      className="role-badge"
      style={{
        borderColor:
          role.color ||
          "#94a3b8",
        color:
          role.color ||
          "#94a3b8",
      }}
    >
      {role.name}
    </span>
  );
}

/* =========================================================
   ROLE MANAGER
========================================================= */

function RoleManagerModal({
  server,
  users,
  onClose,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onToggleMemberRole,
}) {
  const [newRoleName, setNewRoleName] =
    useState("");

  const [newRoleColor, setNewRoleColor] =
    useState("#4d82ff");

  const [selectedRoleId, setSelectedRoleId] =
    useState(
      server.roles?.[0]?.id || ""
    );

  const [editName, setEditName] =
    useState("");

  const [editColor, setEditColor] =
    useState("#94a3b8");

  const [permissionText, setPermissionText] =
    useState("");

  const [memberId, setMemberId] =
    useState(
      server.members?.[0] || ""
    );

  const selectedRole =
    server.roles?.find(
      (role) =>
        role.id ===
        selectedRoleId
    );

  useEffect(() => {
    if (!selectedRole) return;

    setEditName(
      selectedRole.name
    );

    setEditColor(
      selectedRole.color ||
        "#94a3b8"
    );

    setPermissionText(
      (
        selectedRole.permissions ||
        []
      ).join(", ")
    );
  }, [selectedRole]);

  function addRole(event) {
    event.preventDefault();

    if (!newRoleName.trim()) return;

    onCreateRole({
      name:
        newRoleName.trim(),
      color: newRoleColor,
      permissions: [],
    });

    setNewRoleName("");
  }

  function saveRole() {
    if (!selectedRole) return;

    onUpdateRole(
      selectedRole.id,
      {
        name:
          editName.trim() ||
          selectedRole.name,
        color:
          editColor ||
          selectedRole.color,
        permissions:
          parseTags(
            permissionText
          ),
      }
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="role-manager-modal">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>
          Server Roles
        </h2>

        <p className="modal-description">
          Create and manage server roles.
        </p>

        <div className="role-manager-grid">
          <div className="role-list-panel">
            <h3>
              ROLES
            </h3>

            {server.roles?.map(
              (role) => (
                <button
                  key={role.id}
                  className={`role-manager-item ${
                    selectedRoleId ===
                    role.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedRoleId(
                      role.id
                    )
                  }
                >
                  <RoleBadge
                    role={role}
                  />

                  <span>
                    {role.permissions
                      ?.length || 0}{" "}
                    permissions
                  </span>
                </button>
              )
            )}
          </div>

          <div className="role-editor">
            <h3>
              EDIT ROLE
            </h3>

            {selectedRole ? (
              <>
                <label>
                  Role Name
                </label>

                <input
                  value={editName}
                  onChange={(e) =>
                    setEditName(
                      e.target.value
                    )
                  }
                />

                <label>
                  Role Color
                </label>

                <input
                  type="color"
                  value={
                    editColor
                  }
                  onChange={(e) =>
                    setEditColor(
                      e.target.value
                    )
                  }
                />

                <label>
                  Permissions
                </label>

                <input
                  value={
                    permissionText
                  }
                  onChange={(e) =>
                    setPermissionText(
                      e.target.value
                    )
                  }
                  placeholder="Manage Messages, Manage Channels"
                />

                <button
                  className="primary-button"
                  onClick={
                    saveRole
                  }
                >
                  Save Role
                </button>

                <button
                  className="danger-button"
                  onClick={() =>
                    onDeleteRole(
                      selectedRole.id
                    )
                  }
                >
                  Delete Role
                </button>
              </>
            ) : (
              <p>
                Select a role.
              </p>
            )}

            <div className="role-create-box">
              <h3>
                CREATE ROLE
              </h3>

              <form
                onSubmit={addRole}
              >
                <input
                  placeholder="New role name"
                  value={
                    newRoleName
                  }
                  onChange={(e) =>
                    setNewRoleName(
                      e.target.value
                    )
                  }
                />

                <input
                  type="color"
                  value={
                    newRoleColor
                  }
                  onChange={(e) =>
                    setNewRoleColor(
                      e.target.value
                    )
                  }
                />

                <button className="primary-button">
                  + Create Role
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="member-role-manager">
          <h3>
            MEMBER ROLES
          </h3>

          <select
            value={memberId}
            onChange={(e) =>
              setMemberId(
                e.target.value
              )
            }
          >
            {server.members?.map(
              (id) => {
                const user =
                  users.find(
                    (u) =>
                      u.id === id
                  );

                if (!user)
                  return null;

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {user.displayName}{" "}
                    (@
                    {
                      user.username
                    })
                  </option>
                );
              }
            )}
          </select>

          <div className="member-role-options">
            {server.roles?.map(
              (role) => {
                const checked =
                  (
                    server.memberRoles?.[
                      memberId
                    ] || []
                  ).includes(
                    role.id
                  );

                const locked =
                  role.name.toLowerCase() ===
                    "owner" &&
                  memberId ===
                    server.ownerId;

                return (
                  <label
                    key={role.id}
                    className="role-check"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() =>
                        onToggleMemberRole(
                          memberId,
                          role.id
                        )
                      }
                    />

                    <RoleBadge
                      role={role}
                    />
                  </label>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADD PEOPLE
========================================================= */

function AddPeopleModal({
  users,
  currentUser,
  onClose,
  onSelect,
}) {
  const [search, setSearch] =
    useState("");

  const cleanSearch =
    search
      .replace(/^@/, "")
      .toLowerCase();

  const results =
    users.filter(
      (user) =>
        user.id !==
          currentUser.id &&
        (user.username
          .toLowerCase()
          .includes(
            cleanSearch
          ) ||
          user.displayName
            .toLowerCase()
            .includes(
              cleanSearch
            ))
    );

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>
          Add People
        </h2>

        <p className="modal-description">
          Search for a Vexel user by
          @username.
        </p>

        <input
          placeholder="@username"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <div className="people-results">
          {results.map(
            (user) => (
              <button
                className="people-result"
                key={user.id}
                onClick={() =>
                  onSelect(user)
                }
              >
                <Avatar
                  user={user}
                  small
                />

                <div>
                  <strong>
                    {user.displayName}
                  </strong>

                  <span>
                    @{user.username}
                  </span>
                </div>
              </button>
            )
          )}

          {search &&
            results.length ===
              0 && (
              <p className="empty-sidebar">
                No users found.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   VOICE CHANNEL
========================================================= */

function VoiceChannel({
  channel,
  currentUser,
  users,
  onProfile,
}) {
  const members =
    channel.members || [];

  return (
    <main className="main">
      <div className="voice-page">
        <div className="main-header">
          <div>
            <div className="channel-title">
              <span>🔊</span>
              {channel.name}
            </div>

            <div className="channel-topic">
              Voice channel
            </div>
          </div>
        </div>

        <div className="voice-content">
          <div className="voice-icon">
            🔊
          </div>

          <h1>
            {channel.name}
          </h1>

          <p>
            People currently in this
            voice channel
          </p>

          <div className="voice-members">
            {members.length ===
            0 ? (
              <div className="empty-sidebar">
                Nobody is currently in
                this voice channel.
              </div>
            ) : (
              members.map(
                (id) => {
                  const user =
                    users.find(
                      (item) =>
                        item.id === id
                    );

                  if (!user)
                    return null;

                  return (
                    <button
                      key={id}
                      className="voice-member"
                      onClick={() =>
                        onProfile(
                          user.id
                        )
                      }
                    >
                      <Avatar
                        user={user}
                        small
                      />

                      <span>
                        {
                          user.displayName
                        }
                      </span>

                      <span className="voice-status">
                        🎙️
                      </span>
                    </button>
                  );
                }
              )
            )}
          </div>

          <div className="voice-controls">
            <button>
              🎙️ Mute
            </button>

            <button>
              🎧 Deafen
            </button>

            <button>
              ⚙️ Settings
            </button>
          </div>

          <p className="call-note">
            Voice connections require a
            real-time backend/WebRTC service.
          </p>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   PRIVATE CALL
========================================================= */

function PrivateCallModal({
  user,
  onClose,
}) {
  return (
    <div className="modal-backdrop">
      <div className="call-modal">
        <div className="call-avatar">
          <Avatar user={user} />
        </div>

        <h2>
          Private Call
        </h2>

        <p>
          Calling {user.displayName}
        </p>

        <div className="call-status">
          📞 Calling...
        </div>

        <div className="call-actions">
          <button className="secondary-button">
            🎙️ Mute
          </button>

          <button
            className="danger-button"
            onClick={onClose}
          >
            📞 End Call
          </button>
        </div>

        <p className="call-note">
          Cross-device calls require a
          backend/WebRTC service. This
          interface is ready for that
          integration.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN PANEL
========================================================= */

function AdminPanel({
  users,
  currentUser,
  onClose,
  onManageUser,
}) {
  const staffCount =
    users.filter(
      (user) =>
        user.staffBadges?.length > 0
    ).length;

  return (
    <div className="modal-backdrop">
      <div className="admin-panel">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="admin-header">
          <div className="admin-icon-large">
            🛡️
          </div>

          <div>
            <h1>
              Vexel Owner Panel
            </h1>

            <p>
              Owner-only administration
            </p>
          </div>
        </div>

        <div className="admin-warning">
          <strong>
            Owner Access
          </strong>

          <span>
            Signed in as{" "}
            {currentUser.displayName}.
          </span>
        </div>

        <div className="admin-stats">
          <div>
            <strong>
              {users.length}
            </strong>

            <span>
              Users
            </span>
          </div>

          <div>
            <strong>
              {staffCount}
            </strong>

            <span>
              Staff
            </span>
          </div>
        </div>

        <div className="admin-user-list">
          {users.map((user) => (
            <button
              key={user.id}
              className="admin-user"
              onClick={() =>
                onManageUser(user)
              }
            >
              <Avatar
                user={user}
                small
              />

              <div>
                <strong>
                  {user.displayName}
                </strong>

                <span>
                  @{user.username}
                </span>
              </div>

              <div className="admin-badges">
                {user.staffBadges?.map(
                  (badge) => (
                    <StaffBadge
                      key={badge}
                      badge={badge}
                      compact
                    />
                  )
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   GLOBAL STYLES
========================================================= */

function GlobalStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html,
      body,
      #root {
        margin: 0;
        width: 100%;
        height: 100%;
      }

      body {
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        background: #0d1117;
        color: #f4f7fb;
      }

      button,
      input,
      select,
      textarea {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      button:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible {
        outline: 2px solid #5b8dff;
        outline-offset: 2px;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid #34445f;
        background: #111927;
        color: white;
        padding: 12px 13px;
        border-radius: 10px;
        outline: none;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: #5b8dff;
      }

      input[type="file"] {
        padding: 8px;
      }

      input[type="color"] {
        min-height: 42px;
        padding: 4px;
      }

      textarea {
        resize: vertical;
        min-height: 90px;
      }

      label {
        color: #b8c4d6;
        font-size: 13px;
        font-weight: 700;
      }

      button {
        border: 0;
      }

      .app {
        display: flex;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #101722;
      }

      /* AUTH */

      .auth-screen {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background:
          radial-gradient(
            circle at top,
            #263f6c 0,
            #121927 45%,
            #090d14 100%
          );
      }

      .auth-card {
        width: min(440px, 94vw);
        padding: 36px;
        border-radius: 24px;
        background: rgba(19, 27, 40, .98);
        border: 1px solid #30405b;
        box-shadow: 0 30px 80px rgba(0,0,0,.45);
      }

      .auth-logo,
      .home-empty-logo {
        width: 70px;
        height: 70px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg,#4f8cff,#2757d8);
        font-size: 38px;
        font-weight: 900;
        margin-bottom: 20px;
      }

      .auth-card h1 {
        margin: 0 0 8px;
        font-size: 30px;
      }

      .auth-subtitle,
      .modal-description {
        color: #93a1b7;
      }

      .auth-card form,
      .modal-card form,
      .edit-profile-modal form {
        display: grid;
        gap: 10px;
      }

      .auth-switch {
        width: 100%;
        margin-top: 16px;
        background: transparent;
        color: #78a1ff;
      }

      .demo-login {
        margin-top: 18px;
        padding: 10px;
        border-radius: 8px;
        background: #111927;
        color: #8593a9;
        font-size: 12px;
      }

      .primary-button,
      .secondary-button,
      .danger-button {
        width: 100%;
        padding: 12px 15px;
        border-radius: 10px;
        font-weight: 700;
        margin-top: 10px;
      }

      .primary-button {
        background: #4c82ff;
        color: white;
      }

      .primary-button:hover {
        background: #6192ff;
      }

      .secondary-button {
        background: #25324a;
        color: white;
      }

      .secondary-button:hover {
        background: #30415d;
      }

      .danger-button {
        background: #a62d3a;
        color: white;
      }

      .danger-button:hover {
        background: #c23847;
      }

      /* SERVER BAR */

      .server-bar {
        width: 76px;
        min-width: 76px;
        background: #0b1018;
        border-right: 1px solid #1e2a3b;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 8px;
        gap: 9px;
        overflow-y: auto;
      }

      .home-button,
      .server-icon,
      .add-server-button,
      .admin-icon-button,
      .user-server-button {
        width: 52px;
        height: 52px;
        border-radius: 17px;
        background: #182131;
        color: #dce7f7;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 19px;
        flex-shrink: 0;
      }

      .home-button {
        background: linear-gradient(135deg,#4e88ff,#284fd1);
        font-size: 27px;
      }

      .home-button.active,
      .server-icon.active {
        box-shadow: 0 0 0 2px #4d86ff;
        border-radius: 14px;
      }

      .home-button:hover,
      .server-icon:hover,
      .add-server-button:hover,
      .admin-icon-button:hover,
      .user-server-button:hover {
        background: #2c3d59;
      }

      .server-divider {
        width: 35px;
        height: 1px;
        background: #29364a;
      }

      .server-bar-spacer {
        flex: 1;
        min-height: 10px;
      }

      .add-server-button {
        color: #70a2ff;
        font-size: 28px;
      }

      .server-icon-image {
        width: 42px;
        height: 42px;
        border-radius: 13px;
        object-fit: cover;
      }

      /* SIDEBAR */

      .channel-sidebar {
        width: 270px;
        min-width: 270px;
        background: #151d2a;
        border-right: 1px solid #243047;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .sidebar-header {
        min-height: 72px;
        padding: 13px 16px;
        border-bottom: 1px solid #243047;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }

      .sidebar-header-main {
        min-width: 0;
        flex: 1;
      }

      .brand-small {
        color: #6f9eff;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 2px;
      }

      .sidebar-title {
        font-weight: 800;
        font-size: 16px;
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .server-mini-banner {
        height: 45px;
        margin-top: 9px;
        border-radius: 9px;
        background-size: cover;
        background-position: center;
        border: 1px solid #30415b;
      }

      .server-description-small {
        color: #77869d;
        font-size: 10px;
        line-height: 1.4;
        margin-top: 7px;
      }

      .icon-button {
        background: transparent;
        color: #91a0b8;
        font-size: 18px;
      }

      .home-actions {
        padding: 13px 10px 4px;
      }

      .sidebar-main-button {
        width: 100%;
        background: transparent;
        color: #a8b4c8;
        padding: 11px;
        text-align: left;
        border-radius: 8px;
        margin-bottom: 4px;
        font-weight: 700;
      }

      .sidebar-main-button:hover,
      .sidebar-main-button.active {
        background: #22304a;
        color: white;
      }

      .section-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .section-label {
        padding: 14px 15px 6px;
        color: #6f7f97;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 1.2px;
      }

      .tiny-add {
        margin-right: 13px;
        background: transparent;
        color: #8090aa;
        font-size: 18px;
      }

      .channel-list,
      .dm-list {
        padding: 0 8px;
        overflow-y: auto;
      }

      .channel-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 9px;
        background: transparent;
        color: #8492a8;
        padding: 9px 10px;
        border-radius: 8px;
        text-align: left;
        margin-bottom: 2px;
      }

      .channel-item:hover,
      .channel-item.selected {
        background: #22304a;
        color: white;
      }

      .channel-item small {
        margin-left: auto;
        color: #8190a8;
      }

      .dm-user {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 9px;
        background: transparent;
        color: white;
        padding: 8px;
        border-radius: 9px;
        text-align: left;
        margin-bottom: 3px;
      }

      .dm-user:hover,
      .dm-user.selected {
        background: #22304a;
      }

      .dm-user-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
      }

      .dm-user-info strong {
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dm-user-info span {
        color: #77869d;
        font-size: 11px;
      }

      .presence-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #42d879;
      }

      .sidebar-bottom {
        margin-top: auto;
        padding: 10px;
        border-top: 1px solid #243047;
      }

      .empty-sidebar {
        color: #77869d;
        padding: 18px;
        font-size: 13px;
      }

      /* MAIN */

      .main {
        flex: 1;
        min-width: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #101722;
      }

      .main-header {
        min-height: 68px;
        padding: 10px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #263349;
        background: #131b28;
      }

      .channel-title {
        font-size: 17px;
        font-weight: 800;
      }

      .channel-title span {
        color: #6d7b91;
        margin-right: 7px;
      }

      .channel-topic {
        color: #77869d;
        font-size: 12px;
        margin-top: 3px;
      }

      .main-header-user {
        display: flex;
        align-items: center;
        gap: 10px;
        background: transparent;
        color: white;
        text-align: left;
      }

      .main-header-user > div {
        display: flex;
        flex-direction: column;
      }

      .main-header-user span {
        color: #77869d;
        font-size: 11px;
      }

      .main-header-actions {
        display: flex;
        gap: 7px;
      }

      .header-action {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        background: #1c283b;
        color: white;
      }

      .header-action:hover {
        background: #2a3a54;
      }

      /* AVATAR */

      .avatar-wrap {
        position: relative;
        width: max-content;
        flex-shrink: 0;
      }

      .avatar {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg,#405b91,#25334e);
        color: white;
        font-size: 19px;
        font-weight: 900;
        object-fit: cover;
      }

      .avatar.small {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        font-size: 13px;
      }

      .avatar.tiny {
        width: 28px;
        height: 28px;
        border-radius: 9px;
        font-size: 10px;
      }

      .avatar-status {
        position: absolute;
        right: -1px;
        bottom: -1px;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #42d879;
        border: 2px solid #151d2a;
      }

      .avatar-status.away {
        background: #e5a83d;
      }

      .avatar-status.offline {
        background: #68758a;
      }

      /* MESSAGES */

      .messages,
      .dm-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px 22px;
      }

      .message {
        display: flex;
        gap: 12px;
        padding: 7px 0;
      }

      .message-avatar-button {
        background: transparent;
        padding: 0;
        height: max-content;
      }

      .message-body {
        min-width: 0;
        flex: 1;
      }

      .message-author-row {
        display: flex;
        align-items: center;
        gap: 7px;
        flex-wrap: wrap;
      }

      .message-author {
        padding: 0;
        background: transparent;
        color: white;
        font-weight: 800;
      }

      .message-author:hover {
        text-decoration: underline;
      }

      .message-time {
        color: #68778d;
        font-size: 10px;
      }

      .message-text {
        color: #d4dbe7;
        line-height: 1.5;
        margin-top: 3px;
        overflow-wrap: anywhere;
      }

      .message-composer {
        display: flex;
        gap: 10px;
        padding: 13px 18px;
        border-top: 1px solid #263349;
        background: #131b28;
      }

      .message-composer input {
        flex: 1;
      }

      .send-button {
        width: 48px;
        border-radius: 10px;
        background: #4c82ff;
        color: white;
        font-size: 18px;
      }

      .chat-empty {
        height: 100%;
        min-height: 250px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #77869d;
        text-align: center;
      }

      .chat-empty h2 {
        color: #dfe7f4;
        margin-bottom: 5px;
      }

      /* HOME */

      .home-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        text-align: center;
      }

      .home-empty h1 {
        margin: 0 0 8px;
      }

      .home-empty p {
        color: #77869d;
        max-width: 480px;
      }

      /* MODALS */

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(0,0,0,.72);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
      }

      .profile-modal,
      .edit-profile-modal,
      .modal-card,
      .role-manager-modal,
      .admin-panel,
      .call-modal {
        position: relative;
        width: min(650px,96vw);
        max-height: 92vh;
        overflow-y: auto;
        background: #151e2c;
        border: 1px solid #30415b;
        border-radius: 20px;
        box-shadow: 0 30px 90px rgba(0,0,0,.55);
      }

      .modal-card,
      .edit-profile-modal,
      .role-manager-modal,
      .admin-panel {
        padding: 28px;
      }

      .large-modal {
        width: min(700px,96vw);
      }

      .modal-close {
        position: absolute;
        top: 14px;
        right: 15px;
        z-index: 4;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: rgba(0,0,0,.35);
        color: white;
        font-size: 23px;
      }

      /* PROFILE */

      .profile-banner {
        height: 160px;
        background: linear-gradient(135deg,#263d67,#141c2a);
        background-size: cover;
        background-position: center;
      }

      .profile-header {
        display: flex;
        gap: 18px;
        align-items: flex-end;
        padding: 0 25px;
        margin-top: -28px;
      }

      .profile-header > .avatar-wrap {
        border: 5px solid #151e2c;
        border-radius: 20px;
      }

      .profile-name-area {
        padding-bottom: 5px;
      }

      .profile-name-area h1 {
        margin: 0;
        font-size: 25px;
      }

      .profile-username {
        color: #8492a8;
        font-size: 13px;
        margin-top: 3px;
      }

      .profile-status {
        color: #91a0b5;
        font-size: 12px;
        margin-top: 7px;
      }

      .profile-content {
        padding: 25px;
      }

      .profile-section {
        margin-top: 23px;
      }

      .profile-section-title,
      .edit-section-title {
        color: #728199;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 1.3px;
        margin-bottom: 9px;
      }

      .profile-bio {
        color: #c2cada;
        line-height: 1.6;
        margin: 0;
      }

      .profile-tags,
      .staff-badge-list,
      .settings-role-list {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .profile-tag,
      .staff-badge,
      .role-badge {
        display: inline-flex;
        align-items: center;
        width: max-content;
        border-radius: 7px;
        padding: 5px 8px;
        background: #202d42;
        border: 1px solid #34445f;
        color: #cbd5e4;
        font-size: 11px;
        font-weight: 700;
      }

      .staff-badge {
        color: #dce7f8;
        background: #253452;
        border-color: #40567e;
      }

      .staff-badge.compact {
        font-size: 9px;
        padding: 3px 6px;
      }

      .role-badge {
        background: transparent;
      }

      .badge-button {
        background: transparent;
        padding: 0;
      }

      .connections-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 8px;
      }

      .connection-card {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 10px;
        border-radius: 10px;
        background: #1b2638;
        border: 1px solid #2c3b53;
        text-decoration: none;
      }

      .connection-card small {
        color: #728199;
      }

      .connection-help {
        color: #77869d;
        font-size: 12px;
      }

      .profile-actions {
        display: grid;
        grid-template-columns: repeat(2,1fr);
        gap: 8px;
        padding: 0 25px 25px;
      }

      .profile-actions .primary-button,
      .profile-actions .secondary-button {
        margin-top: 0;
      }

      .profile-actions .secondary-button:last-child {
        grid-column: 1 / -1;
      }

      .edit-profile-preview {
        position: relative;
        margin-bottom: 10px;
      }

      .edit-banner-preview {
        height: 120px;
        border-radius: 12px;
        background: linear-gradient(135deg,#263d67,#141c2a);
        background-size: cover;
        background-position: center;
        margin-bottom: -25px;
      }

      .edit-profile-preview .avatar-wrap {
        margin-left: 20px;
        border: 4px solid #151e2c;
        border-radius: 17px;
      }

      .profile-textarea {
        min-height: 100px;
      }

      .two-column {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .connection-edit-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }

      .connection-edit {
        padding: 10px;
        border: 1px solid #293950;
        border-radius: 10px;
        background: #121b29;
      }

      .connection-edit-title {
        display: flex;
        gap: 7px;
        align-items: center;
        margin-bottom: 7px;
      }

      /* ROLES */

      .role-manager-modal {
        width: min(900px,96vw);
      }

      .role-manager-grid {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 18px;
        margin-top: 20px;
      }

      .role-list-panel,
      .role-editor {
        min-width: 0;
      }

      .role-list-panel {
        background: #111927;
        border: 1px solid #2b3a51;
        border-radius: 13px;
        padding: 12px;
      }

      .role-list-panel h3,
      .role-editor h3,
      .member-role-manager h3 {
        color: #8290a7;
        font-size: 11px;
        letter-spacing: 1px;
      }

      .role-manager-item {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 9px;
        background: transparent;
        color: #8190a7;
        border-radius: 8px;
        margin-bottom: 3px;
      }

      .role-manager-item:hover,
      .role-manager-item.selected {
        background: #23324a;
        color: white;
      }

      .role-editor {
        background: #111927;
        border: 1px solid #2b3a51;
        border-radius: 13px;
        padding: 15px;
      }

      .role-create-box {
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid #2a3850;
      }

      .role-create-box form {
        display: grid;
        grid-template-columns: 1fr 55px;
        gap: 8px;
      }

      .role-create-box .primary-button {
        grid-column: 1 / -1;
      }

      .member-role-manager {
        margin-top: 20px;
        padding: 15px;
        background: #111927;
        border: 1px solid #2b3a51;
        border-radius: 13px;
      }

      .member-role-options {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 12px;
      }

      .role-check {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px;
        border-radius: 8px;
        background: #1a2537;
      }

      /* SETTINGS */

      .settings-info {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 12px;
        background: #111927;
        border: 1px solid #293950;
        border-radius: 10px;
        margin-top: 8px;
      }

      .settings-info span {
        color: #8290a7;
      }

      /* PEOPLE */

      .people-results {
        margin-top: 14px;
      }

      .people-result {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        background: transparent;
        color: white;
        padding: 10px;
        border-radius: 9px;
        text-align: left;
      }

      .people-result:hover {
        background: #22304a;
      }

      .people-result div {
        display: flex;
        flex-direction: column;
      }

      .people-result span {
        color: #77869d;
        font-size: 11px;
      }

      /* VOICE */

      .voice-page {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .voice-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        overflow-y: auto;
      }

      .voice-icon {
        width: 80px;
        height: 80px;
        border-radius: 25px;
        background: #223453;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 35px;
      }

      .voice-content p {
        color: #77869d;
      }

      .voice-members {
        width: min(500px,100%);
        display: grid;
        gap: 7px;
        margin-top: 15px;
      }

      .voice-member {
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 10px;
        padding: 10px;
        background: #182437;
        color: white;
        text-align: left;
      }

      .voice-member:hover {
        background: #22324b;
      }

      .voice-status {
        margin-left: auto;
      }

      .voice-controls {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 25px;
      }

      .voice-controls button {
        border-radius: 10px;
        padding: 11px 15px;
        background: #25334b;
        color: white;
      }

      /* CALL */

      .call-modal {
        width: min(420px,94vw);
        padding: 35px;
        text-align: center;
      }

      .call-avatar {
        display: flex;
        justify-content: center;
      }

      .call-avatar .avatar {
        width: 90px;
        height: 90px;
        font-size: 30px;
      }

      .call-status {
        color: #6e9bff;
        margin: 15px 0;
      }

      .call-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .call-actions button {
        margin-top: 0;
      }

      .call-note {
        font-size: 11px;
        color: #69788e;
        line-height: 1.5;
      }

      /* ADMIN */

      .admin-panel {
        width: min(800px,96vw);
      }

      .admin-header {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .admin-icon-large {
        width: 58px;
        height: 58px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 15px;
        background: #263a5d;
        font-size: 27px;
      }

      .admin-header h1 {
        margin: 0;
      }

      .admin-header p {
        color: #77869d;
        margin: 4px 0 0;
      }

      .admin-warning {
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-top: 22px;
        padding: 13px;
        border-radius: 10px;
        background: #302b18;
        border: 1px solid #685a29;
      }

      .admin-warning span {
        color: #b7aa78;
        font-size: 12px;
      }

      .admin-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 12px;
      }

      .admin-stats > div {
        padding: 15px;
        border-radius: 12px;
        background: #111927;
        border: 1px solid #2a3950;
      }

      .admin-stats strong,
      .admin-stats span {
        display: block;
      }

      .admin-stats strong {
        font-size: 25px;
      }

      .admin-stats span {
        color: #77869d;
        font-size: 12px;
      }

      .admin-user-list {
        margin-top: 15px;
      }

      .admin-user {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-bottom: 1px solid #27364c;
        background: transparent;
        color: white;
        text-align: left;
      }

      .admin-user:hover {
        background: #1b293d;
      }

      .admin-user > div:nth-child(2) {
        display: flex;
        flex-direction: column;
        min-width: 130px;
      }

      .admin-user > div:nth-child(2) span {
        color: #77869d;
        font-size: 11px;
      }

      .admin-badges {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }

      /* MOBILE */

      @media (max-width: 800px) {
        .server-bar {
          width: 62px;
          min-width: 62px;
          padding-left: 5px;
          padding-right: 5px;
        }

        .home-button,
        .server-icon,
        .add-server-button,
        .admin-icon-button,
        .user-server-button {
          width: 44px;
          height: 44px;
          border-radius: 13px;
        }

        .channel-sidebar {
          width: 220px;
          min-width: 220px;
        }

        .connections-grid,
        .connection-edit-grid {
          grid-template-columns: 1fr;
        }

        .role-manager-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 620px) {
        .channel-sidebar {
          width: 185px;
          min-width: 185px;
        }

        .profile-header {
          padding-left: 16px;
          padding-right: 16px;
        }

        .profile-content {
          padding: 18px;
        }

        .profile-actions {
          padding-left: 18px;
          padding-right: 18px;
          grid-template-columns: 1fr;
        }

        .profile-actions .secondary-button:last-child {
          grid-column: auto;
        }

        .two-column {
          grid-template-columns: 1fr;
        }

        .edit-profile-modal,
        .modal-card,
        .role-manager-modal,
        .admin-panel {
          padding: 20px;
        }
      }
    `}</style>
  );
}

export default App;