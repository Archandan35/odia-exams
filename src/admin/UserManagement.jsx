// src/pages/UserManagement.jsx
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, doc, updateDoc,
  deleteDoc, addDoc, setDoc, query, where, getDocs,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import TopNavbar   from "../components/TopNavbar";

/* =========================================
   ROLE CONFIG
========================================= */
const ALL_ROLES = ["super-admin", "admin", "moderator", "teacher", "student"];

const ROLE_LABELS = {
  "super-admin": "Super Admin",
  "superadmin":  "Super Admin",
  "admin":       "Admin",
  "moderator":   "Moderator",
  "teacher":     "Teacher",
  "student":     "Student",
};

const ROLE_PERMISSIONS = {
  "super-admin": ["manage_users","manage_roles","manage_exams","manage_questions","view_results","manage_subjects","delete_users","bulk_operations"],
  "superadmin":  ["manage_users","manage_roles","manage_exams","manage_questions","view_results","manage_subjects","delete_users","bulk_operations"],
  "admin":       ["manage_users","manage_exams","manage_questions","view_results","manage_subjects"],
  "moderator":   ["manage_questions","view_results","manage_subjects"],
  "teacher":     ["manage_questions","view_results"],
  "student":     ["view_results"],
};

/* =========================================
   GRANULAR USER ACCESS MAP
   Heading → sub-permissions
========================================= */
const ACCESS_MAP = {
  "Page Access": [
    "view_dashboard", "view_exams", "view_subjects",
    "view_analytics", "view_leaderboard", "view_profile",
  ],
  "User Management": [
    "users_view", "users_create", "users_edit",
    "users_delete", "users_set_password", "users_set_roles",
  ],
  "Exam Management": [
    "exam_create", "exam_edit", "exam_delete",
    "exam_publish", "exam_bulk_import",
  ],
  "Question Management": [
    "question_create", "question_edit", "question_delete",
    "question_bulk_import", "question_smart_edit",
  ],
  "Subject & Topic": [
    "subject_create", "subject_edit", "subject_delete",
    "topic_create", "topic_edit", "topic_delete",
    "subtopic_create", "subtopic_edit", "subtopic_delete",
  ],
  "Results & Analytics": [
    "results_view_all", "results_export", "analytics_view",
    "user_activity_view",
  ],
  "System": [
    "system_settings", "system_logs", "system_backup",
  ],
};

/* =========================================
   HELPERS
========================================= */
function getRoleBadgeClass(role) {
  const r = String(role || "").toLowerCase().replace(/[\s_-]/g, "");
  if (r === "superadmin") return "role-badge role-badge--superadmin";
  if (r === "admin")      return "role-badge role-badge--admin";
  if (r === "moderator")  return "role-badge role-badge--moderator";
  if (r === "teacher")    return "role-badge role-badge--teacher";
  return "role-badge role-badge--student";
}

function formatDateTime(ts) {
  if (!ts) return "-";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function displayName(u) {
  if (u.firstName || u.lastName) return `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return u.name || u.displayName || "-";
}

/* Considers user online if heartbeat within last 60 seconds */
function isUserOnline(u) {
  if (!u.isOnline) return false;
  const last = u.lastSeen || u.lastLogin || 0;
  if (!last) return !!u.isOnline;
  return Date.now() - last < 60_000;
}

/* =========================================
   COMPLETE USER DELETION
========================================= */
async function batchDeleteQuery(q) {
  const snap = await getDocs(q);
  for (const d of snap.docs) await deleteDoc(d.ref);
}

async function deleteUserCompletely(user) {
  const uid   = user.uid || user.id;
  const docId = user.id;

  const collections = [
    "results", "examAttempts", "activityLogs", "analytics",
    "performanceReports", "weakTopics", "strongTopics",
    "subjectAnalysis", "topicAnalysis", "subtopicAnalysis",
    "userSessions", "bookmarks", "notifications",
  ];

  for (const col of collections) {
    try {
      await batchDeleteQuery(query(collection(db, col), where("userId", "==", uid)));
      await batchDeleteQuery(query(collection(db, col), where("uid",    "==", uid)));
    } catch {/* skip */}
  }

  const subCollections = ["activity", "attempts", "reports", "analytics"];
  for (const sub of subCollections) {
    try {
      await batchDeleteQuery(query(collection(db, "users", docId, sub)));
    } catch {/* skip */}
  }

  await deleteDoc(doc(db, "users", docId));
  /* Firebase Auth deletion requires a Cloud Function on users/{id} onDelete */
}

/* =========================================
   COMPONENT
========================================= */
export default function UserManagement() {
  const navigate = useNavigate();

  const [users,        setUsers]        = useState([]);
  const [search,       setSearch]       = useState("");
  const [filterRole,   setFilterRole]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected,     setSelected]     = useState([]);
  const [currentPage,  setCurrentPage]  = useState(1);
  const PAGE_SIZE = 10;

  /* Modals */
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [editUser,        setEditUser]        = useState(null);
  const [viewUser,        setViewUser]        = useState(null);
  const [deleteUser,      setDeleteUser]      = useState(null);
  const [resetUser,       setResetUser]       = useState(null);
  const [showBulkDelete,  setShowBulkDelete]  = useState(false);
  const [showPermissions, setShowPermissions] = useState(null);
  const [setPasswordUser, setSetPasswordUser] = useState(null);
  const [accessUser,      setAccessUser]      = useState(null);

  /* Forms */
  const [addForm,    setAddForm]    = useState({ firstName:"", lastName:"", email:"", username:"", role:"student", status:"active", password:"" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError,   setAddError]   = useState("");
  const [showAddPwd, setShowAddPwd] = useState(false);

  const [editForm,    setEditForm]    = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [newPassword,   setNewPassword]   = useState("");
  const [setPwdLoading, setSetPwdLoading] = useState(false);
  const [setPwdError,   setSetPwdError]   = useState("");
  const [showNewPwd,    setShowNewPwd]    = useState(false);

  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  /* User Access modal state */
  const [accessPermissions, setAccessPermissions] = useState([]);
  const [accessExpanded,    setAccessExpanded]    = useState({});
  const [accessSaving,      setAccessSaving]      = useState(false);

  /* ─── Load ALL users (no orderBy → no missing docs) ─── */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const av = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
        const bv = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
        return bv - av;
      });
      setUsers(data);
    });
    return () => unsub();
  }, []);

  /* ─── Filtering ─── */
  const filtered = users.filter(u => {
    const term  = search.toLowerCase();
    const full  = `${u.firstName || ""} ${u.lastName || ""} ${u.name || ""}`.trim();
    const matchSearch =
      !term ||
      full.toLowerCase().includes(term) ||
      (u.email    || "").toLowerCase().includes(term) ||
      (u.username || "").toLowerCase().includes(term);
    const matchRole   = filterRole   === "all" || u.role   === filterRole;
    const matchStatus = filterStatus === "all" || (u.status || "active") === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages       = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated        = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allOnPageSelected = paginated.length > 0 && paginated.every(u => selected.includes(u.id));

  function toggleSelectAll() {
    if (allOnPageSelected) {
      setSelected(prev => prev.filter(id => !paginated.find(u => u.id === id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...paginated.map(u => u.id)])]);
    }
  }
  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  /* ─── Add ─── */
  async function handleAddUser() {
    if (!addForm.firstName || !addForm.email || !addForm.password) {
      setAddError("First name, email, and password are required.");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, addForm.email, addForm.password);
      await addDoc(collection(db, "users"), {
        uid:       cred.user.uid,
        firstName: addForm.firstName,
        lastName:  addForm.lastName,
        name:      `${addForm.firstName} ${addForm.lastName}`.trim(),
        email:     addForm.email,
        username:  addForm.username || "",
        role:      addForm.role,
        status:    addForm.status,
        createdAt: Date.now(),
        lastLogin: null,
        isOnline:  false,
        permissions: [],
      });
      setShowAddModal(false);
      setAddForm({ firstName:"", lastName:"", email:"", username:"", role:"student", status:"active", password:"" });
      setShowAddPwd(false);
    } catch (e) { setAddError(e.message); }
    setAddLoading(false);
  }

  /* ─── Edit ─── */
  function openEdit(user) {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName:  user.lastName  || "",
      username:  user.username  || "",
      role:      user.role      || "student",
      status:    user.status    || "active",
    });
  }
  async function handleEditUser() {
    if (!editUser) return;
    setEditLoading(true);
    try {
      await updateDoc(doc(db, "users", editUser.id), {
        firstName: editForm.firstName,
        lastName:  editForm.lastName,
        name:      `${editForm.firstName} ${editForm.lastName}`.trim(),
        username:  editForm.username,
        role:      editForm.role,
        status:    editForm.status,
      });
      setEditUser(null);
    } catch (e) { console.error(e); }
    setEditLoading(false);
  }

  /* ─── Delete ─── */
  async function handleDeleteUser() {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      await deleteUserCompletely(deleteUser);
      setDeleteUser(null);
      setSelected(prev => prev.filter(id => id !== deleteUser.id));
    } catch (e) { console.error("Delete failed:", e); }
    setDeleteLoading(false);
  }
  async function handleBulkDelete() {
    for (const id of selected) {
      const user = users.find(u => u.id === id);
      if (user) await deleteUserCompletely(user);
    }
    setSelected([]);
    setShowBulkDelete(false);
  }

  /* ─── Status / activity ─── */
  async function toggleStatus(user) {
    const next = (user.status || "active") === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "users", user.id), { status: next });
  }
  function viewActivity(user) {
    navigate("/admin/user-activity", { state: { user } });
  }

  /* ─── Passwords ─── */
  async function handleSendPasswordReset() {
    if (!resetUser) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetUser.email);
      setResetSent(true);
    } catch (e) { console.error(e); }
    setResetLoading(false);
  }
  function closeResetModal() { setResetUser(null); setResetSent(false); setResetLoading(false); }

  async function handleSetPassword() {
    if (!setPasswordUser || !newPassword) return;
    if (newPassword.length < 6) { setSetPwdError("Password must be at least 6 characters."); return; }
    setSetPwdLoading(true);
    setSetPwdError("");
    try {
      if (auth.currentUser?.email === setPasswordUser.email) {
        await updatePassword(auth.currentUser, newPassword);
        closeSetPasswordModal();
      } else {
        await sendPasswordResetEmail(auth, setPasswordUser.email);
        setSetPwdError("Direct password change requires Firebase Admin SDK. A reset email has been sent instead.");
      }
    } catch (e) { setSetPwdError(e.message); }
    setSetPwdLoading(false);
  }
  function closeSetPasswordModal() {
    setSetPasswordUser(null);
    setNewPassword("");
    setSetPwdError("");
    setShowNewPwd(false);
  }

  /* ─── User Access modal ─── */
  function openAccess(user) {
    setAccessUser(user);
    setAccessPermissions(user.permissions || []);
    setAccessExpanded({});
  }
  function toggleAccessHeading(heading) {
    setAccessExpanded(p => ({ ...p, [heading]: !p[heading] }));
  }
  function togglePermission(perm) {
    setAccessPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  }
  function toggleHeadingAll(heading) {
    const perms = ACCESS_MAP[heading];
    const allOn = perms.every(p => accessPermissions.includes(p));
    setAccessPermissions(prev =>
      allOn ? prev.filter(p => !perms.includes(p))
            : [...new Set([...prev, ...perms])]
    );
  }
  async function saveAccess() {
    if (!accessUser) return;
    setAccessSaving(true);
    try {
      await updateDoc(doc(db, "users", accessUser.id), {
        permissions: accessPermissions,
      });
      setAccessUser(null);
    } catch (e) { console.error(e); }
    setAccessSaving(false);
  }

  /* =========================================
     RENDER
  ========================================= */
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <TopNavbar />

        <div className="page-header">
          <div>
            <h2>User Management</h2>
            <p>Manage registered users, roles, permissions, and account status</p>
          </div>
          <div className="header-actions">
            {selected.length > 0 && (
              <button className="delete-btn" onClick={() => setShowBulkDelete(true)}>
                Delete Selected ({selected.length})
              </button>
            )}
            <button onClick={() => setShowAddModal(true)}>+ Add User</button>
          </div>
        </div>

        {/* STATS */}
        <div className="dashboard-grid">
          <div className="analytics-card"><h3>Total Users</h3><h1>{users.length}</h1></div>
          <div className="analytics-card"><h3>Active</h3><h1>{users.filter(u => (u.status || "active") === "active").length}</h1></div>
          <div className="analytics-card"><h3>Online Now</h3><h1>{users.filter(isUserOnline).length}</h1></div>
          <div className="analytics-card"><h3>Admins</h3><h1>{users.filter(u => {
            const r = String(u.role || "").toLowerCase().replace(/[\s_-]/g, "");
            return r === "admin" || r === "superadmin";
          }).length}</h1></div>
        </div>

        {/* FILTERS */}
        <div className="filter-grid">
          <input
            placeholder="Search by name, email, or username…"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <select className="filter-select" value={filterRole}
                  onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <select className="filter-select" value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3 className="um-table-title">
            Users
            <span className="um-count-badge">{filtered.length}</span>
          </h3>
          <div className="um-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} /></th>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Online</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={9} className="um-empty-row">No users found.</td></tr>
                ) : paginated.map(user => {
                  const online = isUserOnline(user);
                  return (
                    <tr key={user.id} className={selected.includes(user.id) ? "um-row-selected" : ""}>
                      <td>
                        <input type="checkbox"
                               checked={selected.includes(user.id)}
                               onChange={() => toggleSelect(user.id)} />
                      </td>
                      <td>
                        <div className="um-user-cell">
                          <div className="avatar um-avatar-sm">
                            {(displayName(user) || user.email || "?")[0].toUpperCase()}
                          </div>
                          <div className="um-user-info">
                            <strong>{displayName(user)}</strong>
                            <span className="um-email">{user.email || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.username || "-"}</td>
                      <td>
                        <span className={getRoleBadgeClass(user.role)}>
                          {ROLE_LABELS[user.role] || user.role || "Student"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={(user.status || "active") === "active"
                            ? "um-status-badge um-status-active"
                            : "um-status-badge um-status-inactive"}
                          onClick={() => toggleStatus(user)}
                        >
                          {(user.status || "active") === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <div className="um-online-cell">
                          <span className={online ? "um-online-dot um-online" : "um-online-dot um-offline"} />
                          <span className="um-online-label">{online ? "Online" : "Offline"}</span>
                        </div>
                      </td>
                      <td className="um-date-cell">{formatDateTime(user.lastLogin)}</td>
                      <td className="um-date-cell">{formatDateTime(user.createdAt)}</td>
                      <td>
                        <div className="um-action-group">
                          <button className="btn btn-secondary btn-sm" title="View Profile"   onClick={() => setViewUser(user)}>👁</button>
                          <button className="btn btn-secondary btn-sm" title="Edit User"      onClick={() => openEdit(user)}>✏️</button>
                          <button className="btn btn-secondary btn-sm" title="View Activity"  onClick={() => viewActivity(user)}>📊</button>
                          <button className="btn btn-secondary btn-sm" title="Role Permissions" onClick={() => setShowPermissions(user)}>🔑</button>
                          <button className="btn btn-secondary btn-sm" title="User Access"    onClick={() => openAccess(user)}>🛡️</button>
                          <button className="btn btn-secondary btn-sm" title="Reset Password" onClick={() => setResetUser(user)}>📧</button>
                          <button className="btn btn-secondary btn-sm" title="Set Password"   onClick={() => setSetPasswordUser(user)}>🔒</button>
                          <button className="btn btn-danger btn-sm"    title="Delete User"    onClick={() => setDeleteUser(user)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p}
                        className={p === currentPage ? "active" : ""}
                        onClick={() => setCurrentPage(p)}>
                  {p}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
            </div>
          )}
        </div>
      </div>

      {/* ─── ADD USER ─── */}
      {showAddModal && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Add New User</h3>
            {addError && <p className="um-form-error">{addError}</p>}
            <div className="um-form-grid">
              <div className="um-form-field">
                <label>First Name *</label>
                <input value={addForm.firstName} onChange={e => setAddForm({ ...addForm, firstName: e.target.value })} />
              </div>
              <div className="um-form-field">
                <label>Last Name</label>
                <input value={addForm.lastName} onChange={e => setAddForm({ ...addForm, lastName: e.target.value })} />
              </div>
              <div className="um-form-field">
                <label>Email *</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div className="um-form-field">
                <label>Username</label>
                <input value={addForm.username} onChange={e => setAddForm({ ...addForm, username: e.target.value })} />
              </div>
              <div className="um-form-field">
                <label>Password *</label>
                <div className="um-password-field">
                  <input type={showAddPwd ? "text" : "password"}
                         value={addForm.password}
                         onChange={e => setAddForm({ ...addForm, password: e.target.value })} />
                  <button type="button" className="um-pwd-toggle" onClick={() => setShowAddPwd(v => !v)}>
                    {showAddPwd ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div className="um-form-field">
                <label>Role</label>
                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="um-form-field">
                <label>Status</label>
                <select value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => { setShowAddModal(false); setAddError(""); setShowAddPwd(false); }}>Cancel</button>
              <button className="submit-btn" onClick={handleAddUser} disabled={addLoading}>
                {addLoading ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT USER ─── */}
      {editUser && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Edit User</h3>
            <p className="um-modal-sub">{editUser.email}</p>
            <div className="um-form-grid">
              <div className="um-form-field">
                <label>First Name</label>
                <input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
              </div>
              <div className="um-form-field">
                <label>Last Name</label>
                <input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
              </div>
              <div className="um-form-field">
                <label>Username</label>
                <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
              </div>
              <div className="um-form-field">
                <label>Role</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="um-form-field">
                <label>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="edit-btn" onClick={handleEditUser} disabled={editLoading}>
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW USER ─── */}
      {viewUser && (
        <div className="popup-overlay">
          <div className="popup large-popup">
            <h3>User Profile</h3>
            <div className="um-profile-header">
              <div className="avatar um-avatar-lg">
                {(displayName(viewUser) || viewUser.email || "?")[0].toUpperCase()}
              </div>
              <div className="um-profile-info">
                <h2>{displayName(viewUser)}</h2>
                <p>{viewUser.email}</p>
                <span className={getRoleBadgeClass(viewUser.role)}>
                  {ROLE_LABELS[viewUser.role] || viewUser.role}
                </span>
              </div>
            </div>
            <div className="um-profile-details-grid">
              <div className="um-detail-item"><span className="um-detail-label">First Name</span><span className="um-detail-value">{viewUser.firstName || "-"}</span></div>
              <div className="um-detail-item"><span className="um-detail-label">Last Name</span><span className="um-detail-value">{viewUser.lastName || "-"}</span></div>
              <div className="um-detail-item"><span className="um-detail-label">Username</span><span className="um-detail-value">{viewUser.username || "-"}</span></div>
              <div className="um-detail-item">
                <span className="um-detail-label">Status</span>
                <span className={(viewUser.status || "active") === "active" ? "um-status-badge um-status-active" : "um-status-badge um-status-inactive"}>
                  {viewUser.status || "active"}
                </span>
              </div>
              <div className="um-detail-item">
                <span className="um-detail-label">Online</span>
                <div className="um-online-cell">
                  <span className={isUserOnline(viewUser) ? "um-online-dot um-online" : "um-online-dot um-offline"} />
                  <span className="um-online-label">{isUserOnline(viewUser) ? "Online" : "Offline"}</span>
                </div>
              </div>
              <div className="um-detail-item"><span className="um-detail-label">Last Login</span><span className="um-detail-value">{formatDateTime(viewUser.lastLogin)}</span></div>
              <div className="um-detail-item"><span className="um-detail-label">Account Created</span><span className="um-detail-value">{formatDateTime(viewUser.createdAt)}</span></div>
              <div className="um-detail-item"><span className="um-detail-label">UID</span><span className="um-detail-value um-uid">{viewUser.uid || "-"}</span></div>
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => setViewUser(null)}>Close</button>
              <button onClick={() => { setViewUser(null); viewActivity(viewUser); }}>View Full Activity</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ROLE PERMISSIONS (read-only) ─── */}
      {showPermissions && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Role Permissions</h3>
            <p className="um-modal-sub">
              <span className={getRoleBadgeClass(showPermissions.role)}>
                {ROLE_LABELS[showPermissions.role] || showPermissions.role}
              </span>
              &nbsp;— {displayName(showPermissions) || showPermissions.email}
            </p>
            <div className="um-permissions-list">
              {(ROLE_PERMISSIONS[showPermissions.role] || []).map(perm => (
                <div key={perm} className="um-permission-item">
                  <span className="um-perm-check">✓</span>
                  <span>{perm.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
            <div className="um-rbac-grid">
              <h4>All Roles &amp; Permissions</h4>
              {ALL_ROLES.map(role => (
                <div key={role} className="um-rbac-row">
                  <span className={getRoleBadgeClass(role)}>{ROLE_LABELS[role]}</span>
                  <span className="um-rbac-perms">{(ROLE_PERMISSIONS[role] || []).join(" · ")}</span>
                </div>
              ))}
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => setShowPermissions(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── USER ACCESS MODAL (granular) ─── */}
      {accessUser && (
        <div className="popup-overlay">
          <div className="popup large-popup ua-popup">
            <h3>User Access Control</h3>
            <p className="um-modal-sub">
              Configure granular permissions for <strong>{displayName(accessUser) || accessUser.email}</strong>
            </p>
            <div className="ua-list">
              {Object.entries(ACCESS_MAP).map(([heading, perms]) => {
                const enabledCount = perms.filter(p => accessPermissions.includes(p)).length;
                const expanded     = !!accessExpanded[heading];
                const allOn        = enabledCount === perms.length;
                return (
                  <div key={heading} className="ua-group">
                    <div className="ua-group-header" onClick={() => toggleAccessHeading(heading)}>
                      <div className="ua-group-title">
                        <span className="ua-chevron">{expanded ? "▾" : "▸"}</span>
                        <span>{heading}</span>
                        <span className="um-count-badge">{enabledCount}/{perms.length}</span>
                      </div>
                      <label className="ua-group-toggle" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={allOn} onChange={() => toggleHeadingAll(heading)} />
                        <span>All</span>
                      </label>
                    </div>
                    {expanded && (
                      <div className="ua-sublist">
                        {perms.map(perm => (
                          <label key={perm} className="ua-perm-row">
                            <input type="checkbox"
                                   checked={accessPermissions.includes(perm)}
                                   onChange={() => togglePermission(perm)} />
                            <span>{perm.replace(/_/g, " ")}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => setAccessUser(null)}>Cancel</button>
              <button className="submit-btn" onClick={saveAccess} disabled={accessSaving}>
                {accessSaving ? "Saving…" : "Save Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD ─── */}
      {resetUser && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Send Password Reset Email</h3>
            {!resetSent ? (
              <>
                <p className="um-modal-sub">A password reset link will be sent to <strong>{resetUser.email}</strong>.</p>
                <div className="um-modal-actions">
                  <button className="cancel-btn" onClick={closeResetModal}>Cancel</button>
                  <button className="submit-btn" onClick={handleSendPasswordReset} disabled={resetLoading}>
                    {resetLoading ? "Sending…" : "Send Reset Email"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="um-form-success">✅ Password reset email sent to <strong>{resetUser.email}</strong>.</p>
                <div className="um-modal-actions">
                  <button onClick={closeResetModal}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── SET PASSWORD ─── */}
      {setPasswordUser && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Set New Password</h3>
            <p className="um-modal-sub">Setting a new password for <strong>{displayName(setPasswordUser) || setPasswordUser.email}</strong>.</p>
            {setPwdError && <p className="um-form-error">{setPwdError}</p>}
            <div className="um-form-field">
              <label>New Password</label>
              <div className="um-password-field">
                <input type={showNewPwd ? "text" : "password"}
                       placeholder="Enter new password (min. 6 chars)"
                       value={newPassword}
                       onChange={e => setNewPassword(e.target.value)} />
                <button type="button" className="um-pwd-toggle" onClick={() => setShowNewPwd(v => !v)}>
                  {showNewPwd ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={closeSetPasswordModal}>Cancel</button>
              <button className="submit-btn" onClick={handleSetPassword} disabled={setPwdLoading || !newPassword}>
                {setPwdLoading ? "Updating…" : "Set Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE ─── */}
      {deleteUser && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Delete User</h3>
            <p>
              Permanently delete <strong>{displayName(deleteUser) || deleteUser.email}</strong>?
              This removes their profile, all exam results, analytics, activity data, and every
              related record. This action cannot be undone.
            </p>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteUser(null)} disabled={deleteLoading}>Cancel</button>
              <button className="delete-btn" onClick={handleDeleteUser} disabled={deleteLoading}>
                {deleteLoading ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BULK DELETE ─── */}
      {showBulkDelete && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Bulk Delete</h3>
            <p>Permanently delete <strong>{selected.length} selected users</strong> and all their associated data? This cannot be undone.</p>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => setShowBulkDelete(false)}>Cancel</button>
              <button className="delete-btn" onClick={handleBulkDelete}>Delete All Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
