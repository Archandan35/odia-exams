import { useEffect, useState } from "react";
import {
  collection, onSnapshot, doc, updateDoc,
  deleteDoc, addDoc, query, where, getDocs, orderBy,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import TopNavbar from "../components/TopNavbar";

/* =========================================
   RBAC PERMISSIONS MAP
========================================= */
const ROLE_PERMISSIONS = {
  "super-admin": ["manage_users","manage_roles","manage_exams","manage_questions","view_results","manage_subjects","delete_users","bulk_operations"],
  "superadmin":  ["manage_users","manage_roles","manage_exams","manage_questions","view_results","manage_subjects","delete_users","bulk_operations"],
  "admin":       ["manage_users","manage_exams","manage_questions","view_results","manage_subjects"],
  "moderator":   ["manage_questions","view_results","manage_subjects"],
  "teacher":     ["manage_questions","view_results"],
  "student":     ["view_results"],
};

const ALL_ROLES   = ["super-admin","admin","moderator","teacher","student"];
const ROLE_LABELS = {
  "super-admin": "Super Admin",
  "superadmin":  "Super Admin",
  "admin":       "Admin",
  "moderator":   "Moderator",
  "teacher":     "Teacher",
  "student":     "Student",
};

function getRoleBadgeClass(role) {
  const map = {
    "super-admin": "role-badge role-badge--superadmin",
    "superadmin":  "role-badge role-badge--superadmin",
    "admin":       "role-badge role-badge--admin",
    "moderator":   "role-badge role-badge--moderator",
    "teacher":     "role-badge role-badge--teacher",
    "student":     "role-badge role-badge--student",
  };
  return map[role] || "role-badge role-badge--student";
}

function formatDateTime(ts) { if (!ts) return "-"; return new Date(ts).toLocaleString(); }

/* Delete all Firestore docs matching a query */
async function deleteDocs(q) {
  const snap = await getDocs(q);
  for (const d of snap.docs) await deleteDoc(doc(db, d.ref.path));
}

export default function UserManagement() {
  const navigate = useNavigate();

  const [users,        setUsers]        = useState([]);
  const [search,       setSearch]       = useState("");
  const [filterRole,   setFilterRole]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected,     setSelected]     = useState([]);
  const [currentPage,  setCurrentPage]  = useState(1);
  const PAGE_SIZE = 10;

  // Modals
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [editUser,        setEditUser]        = useState(null);
  const [viewUser,        setViewUser]        = useState(null);
  const [deleteUser,      setDeleteUser]      = useState(null);
  const [resetUser,       setResetUser]       = useState(null);
  const [showBulkDelete,  setShowBulkDelete]  = useState(false);
  const [showPermissions, setShowPermissions] = useState(null);
  const [setPasswordUser, setSetPasswordUser] = useState(null);

  // Add user form
  const [addForm,    setAddForm]    = useState({ name:"", email:"", username:"", role:"student", status:"active", password:"" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError,   setAddError]   = useState("");
  const [showAddPwd, setShowAddPwd] = useState(false);

  // Edit form
  const [editForm,    setEditForm]    = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete loading
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Set-password form
  const [newPassword,   setNewPassword]   = useState("");
  const [setPwdLoading, setSetPwdLoading] = useState(false);
  const [setPwdError,   setSetPwdError]   = useState("");
  const [showNewPwd,    setShowNewPwd]    = useState(false);

  // Reset password feedback
  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  /* ─── Load users ─── */
  useEffect(() => {
    let unsub;
    try {
      unsub = onSnapshot(
        query(collection(db,"users"), orderBy("createdAt","desc")),
        snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))),
        () => {
          unsub = onSnapshot(collection(db,"users"), snap => {
            const data = snap.docs.map(d=>({id:d.id,...d.data()}));
            data.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
            setUsers(data);
          });
        }
      );
    } catch {
      unsub = onSnapshot(collection(db,"users"), snap => {
        const data = snap.docs.map(d=>({id:d.id,...d.data()}));
        data.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
        setUsers(data);
      });
    }
    return () => unsub && unsub();
  }, []);

  /* ─── Filter + Pagination ─── */
  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      (u.name||"").toLowerCase().includes(term) ||
      (u.email||"").toLowerCase().includes(term) ||
      (u.username||"").toLowerCase().includes(term);
    const matchRole   = filterRole   === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

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

  /* ─── Add User ─── */
  async function handleAddUser() {
    if (!addForm.name || !addForm.email || !addForm.password) {
      setAddError("Name, email, and password are required.");
      return;
    }
    setAddLoading(true); setAddError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, addForm.email, addForm.password);
      await addDoc(collection(db,"users"), {
        uid:       cred.user.uid,
        name:      addForm.name,
        email:     addForm.email,
        username:  addForm.username || "",
        role:      addForm.role,
        status:    addForm.status,
        createdAt: Date.now(),
        lastLogin: null,
        isOnline:  false,
      });
      setShowAddModal(false);
      setAddForm({ name:"", email:"", username:"", role:"student", status:"active", password:"" });
      setShowAddPwd(false);
    } catch(e) { setAddError(e.message); }
    setAddLoading(false);
  }

  /* ─── Edit User ─── */
  function openEdit(user) {
    setEditUser(user);
    setEditForm({ name: user.name||"", username: user.username||"", role: user.role||"student", status: user.status||"active" });
  }

  async function handleEditUser() {
    if (!editUser) return;
    setEditLoading(true);
    try {
      await updateDoc(doc(db,"users",editUser.id), {
        name:     editForm.name,
        username: editForm.username,
        role:     editForm.role,
        status:   editForm.status,
      });
      setEditUser(null);
    } catch(e) { console.error(e); }
    setEditLoading(false);
  }

  /* ─── Complete User Deletion (cascades all data) ─── */
  async function deleteUserCompletely(user) {
    const uid = user.uid || user.id;

    // 1. Delete all results for this user
    const rq = query(collection(db,"results"), where("userId","==",uid));
    const rSnap = await getDocs(rq);
    for (const d of rSnap.docs) await deleteDoc(doc(db,"results",d.id));

    // 2. Delete exam sessions / attempts if any collection exists
    try {
      const aq = query(collection(db,"examAttempts"), where("userId","==",uid));
      const aSnap = await getDocs(aq);
      for (const d of aSnap.docs) await deleteDoc(doc(db,"examAttempts",d.id));
    } catch(_) {}

    // 3. Delete activity logs if collection exists
    try {
      const lq = query(collection(db,"activityLogs"), where("userId","==",uid));
      const lSnap = await getDocs(lq);
      for (const d of lSnap.docs) await deleteDoc(doc(db,"activityLogs",d.id));
    } catch(_) {}

    // 4. Delete Firestore user document
    await deleteDoc(doc(db,"users",user.id));

    // Note: Firebase Auth deletion requires Admin SDK on the backend.
    // The Firestore profile is removed here. For Auth cleanup,
    // use a Cloud Function triggered on users/{uid} delete.
  }

  async function handleDeleteUser() {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      await deleteUserCompletely(deleteUser);
      setDeleteUser(null);
      setSelected(prev => prev.filter(id => id !== deleteUser.id));
    } catch(e) { console.error("Delete failed:", e); }
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

  async function toggleStatus(user) {
    const next = user.status === "active" ? "inactive" : "active";
    await updateDoc(doc(db,"users",user.id), { status: next });
  }

  function viewActivity(user) {
    navigate("/admin/user-activity", { state: { user } });
  }

  /* ─── Password Reset ─── */
  async function handleSendPasswordReset() {
    if (!resetUser) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetUser.email);
      setResetSent(true);
    } catch(e) { console.error(e); }
    setResetLoading(false);
  }

  function closeResetModal() { setResetUser(null); setResetSent(false); setResetLoading(false); }

  async function handleSetPassword() {
    if (!setPasswordUser || !newPassword) return;
    if (newPassword.length < 6) { setSetPwdError("Password must be at least 6 characters."); return; }
    setSetPwdLoading(true); setSetPwdError("");
    try {
      if (auth.currentUser?.email === setPasswordUser.email) {
        await updatePassword(auth.currentUser, newPassword);
        setSetPasswordUser(null); setNewPassword(""); setShowNewPwd(false);
      } else {
        await sendPasswordResetEmail(auth, setPasswordUser.email);
        setSetPwdError("Direct password change requires Firebase Admin SDK. A reset email has been sent instead.");
      }
    } catch(e) { setSetPwdError(e.message); }
    setSetPwdLoading(false);
  }

  function closeSetPasswordModal() { setSetPasswordUser(null); setNewPassword(""); setSetPwdError(""); setShowNewPwd(false); }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <TopNavbar />

        {/* PAGE HEADER */}
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
          <div className="analytics-card"><h3>Active</h3><h1>{users.filter(u=>u.status==="active").length}</h1></div>
          <div className="analytics-card"><h3>Online Now</h3><h1>{users.filter(u=>u.isOnline).length}</h1></div>
          <div className="analytics-card"><h3>Admins</h3><h1>{users.filter(u=>["admin","super-admin","superadmin"].includes(u.role)).length}</h1></div>
        </div>

        {/* FILTER BAR */}
        <div className="filter-grid">
          <input
            placeholder="Search by name, email, or username…"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <select
            className="filter-select"
            value={filterRole}
            onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* USER TABLE */}
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
                ) : paginated.map(user => (
                  <tr key={user.id} className={selected.includes(user.id) ? "um-row-selected" : ""}>
                    <td><input type="checkbox" checked={selected.includes(user.id)} onChange={() => toggleSelect(user.id)} /></td>
                    <td>
                      <div className="um-user-cell">
                        <div className="avatar um-avatar-sm">
                          {(user.name||user.email||"?")[0].toUpperCase()}
                        </div>
                        <div className="um-user-info">
                          <strong>{user.name || "-"}</strong>
                          <span className="um-email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.username || "-"}</td>
                    <td><span className={getRoleBadgeClass(user.role)}>{ROLE_LABELS[user.role] || user.role || "-"}</span></td>
                    <td>
                      <button
                        className={user.status === "active" ? "um-status-badge um-status-active" : "um-status-badge um-status-inactive"}
                        onClick={() => toggleStatus(user)}
                      >
                        {user.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <span className={user.isOnline ? "um-online-dot um-online" : "um-online-dot um-offline"} />
                      <span className="um-online-label">{user.isOnline ? "Online" : "Offline"}</span>
                    </td>
                    <td className="um-date-cell">{formatDateTime(user.lastLogin)}</td>
                    <td className="um-date-cell">{formatDateTime(user.createdAt)}</td>
                    <td>
                      <div className="um-action-group">
                        <button className="btn btn-secondary btn-sm" title="View Profile"   onClick={() => setViewUser(user)}>👁</button>
                        <button className="btn btn-secondary btn-sm" title="Edit User"      onClick={() => openEdit(user)}>✏️</button>
                        <button className="btn btn-secondary btn-sm" title="View Activity"  onClick={() => viewActivity(user)}>📊</button>
                        <button className="btn btn-secondary btn-sm" title="Permissions"    onClick={() => setShowPermissions(user)}>🔑</button>
                        <button className="btn btn-secondary btn-sm" title="Reset Password" onClick={() => setResetUser(user)}>📧</button>
                        <button className="btn btn-secondary btn-sm" title="Set Password"   onClick={() => setSetPasswordUser(user)}>🔒</button>
                        <button className="btn btn-danger btn-sm"    title="Delete User"    onClick={() => setDeleteUser(user)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={currentPage===1} onClick={() => setCurrentPage(p=>p-1)}>‹</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                <button key={p} className={p===currentPage?"active":""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>p+1)}>›</button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: ADD USER ── */}
      {showAddModal && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Add New User</h3>
            {addError && <p className="um-form-error">{addError}</p>}
            <div className="um-form-grid">
              <div className="um-form-field">
                <label>Full Name *</label>
                <input placeholder="Full name" value={addForm.name} onChange={e => setAddForm({...addForm,name:e.target.value})} />
              </div>
              <div className="um-form-field">
                <label>Email *</label>
                <input type="email" placeholder="Email address" value={addForm.email} onChange={e => setAddForm({...addForm,email:e.target.value})} />
              </div>
              <div className="um-form-field">
                <label>Username</label>
                <input placeholder="Username" value={addForm.username} onChange={e => setAddForm({...addForm,username:e.target.value})} />
              </div>
              <div className="um-form-field">
                <label>Password *</label>
                <div className="um-password-field">
                  <input
                    type={showAddPwd?"text":"password"}
                    placeholder="Password"
                    value={addForm.password}
                    onChange={e => setAddForm({...addForm,password:e.target.value})}
                  />
                  <button type="button" className="um-pwd-toggle" onClick={() => setShowAddPwd(v=>!v)}>
                    {showAddPwd ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div className="um-form-field">
                <label>Role</label>
                <select value={addForm.role} onChange={e => setAddForm({...addForm,role:e.target.value})}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="um-form-field">
                <label>Status</label>
                <select value={addForm.status} onChange={e => setAddForm({...addForm,status:e.target.value})}>
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

      {/* ── MODAL: EDIT USER ── */}
      {editUser && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Edit User</h3>
            <p className="um-modal-sub">{editUser.email}</p>
            <div className="um-form-grid">
              <div className="um-form-field">
                <label>Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm,name:e.target.value})} />
              </div>
              <div className="um-form-field">
                <label>Username</label>
                <input value={editForm.username} onChange={e => setEditForm({...editForm,username:e.target.value})} />
              </div>
              <div className="um-form-field">
                <label>Role</label>
                <select value={editForm.role} onChange={e => setEditForm({...editForm,role:e.target.value})}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="um-form-field">
                <label>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm,status:e.target.value})}>
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

      {/* ── MODAL: VIEW USER ── */}
      {viewUser && (
        <div className="popup-overlay">
          <div className="popup large-popup">
            <h3>User Profile</h3>
            <div className="um-profile-header">
              <div className="avatar um-avatar-lg">
                {(viewUser.name||viewUser.email||"?")[0].toUpperCase()}
              </div>
              <div className="um-profile-info">
                <h2>{viewUser.name || "-"}</h2>
                <p>{viewUser.email}</p>
                <span className={getRoleBadgeClass(viewUser.role)}>
                  {ROLE_LABELS[viewUser.role] || viewUser.role}
                </span>
              </div>
            </div>
            <div className="um-profile-details-grid">
              <div className="um-detail-item"><span className="um-detail-label">Username</span><span className="um-detail-value">{viewUser.username||"-"}</span></div>
              <div className="um-detail-item">
                <span className="um-detail-label">Status</span>
                <span className={viewUser.status==="active"?"um-status-badge um-status-active":"um-status-badge um-status-inactive"}>{viewUser.status||"-"}</span>
              </div>
              <div className="um-detail-item">
                <span className="um-detail-label">Online</span>
                <span><span className={viewUser.isOnline?"um-online-dot um-online":"um-online-dot um-offline"}/>{viewUser.isOnline?"Online":"Offline"}</span>
              </div>
              <div className="um-detail-item"><span className="um-detail-label">Last Login</span><span className="um-detail-value">{formatDateTime(viewUser.lastLogin)}</span></div>
              <div className="um-detail-item"><span className="um-detail-label">Account Created</span><span className="um-detail-value">{formatDateTime(viewUser.createdAt)}</span></div>
              <div className="um-detail-item"><span className="um-detail-label">UID</span><span className="um-detail-value um-uid">{viewUser.uid||"-"}</span></div>
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => setViewUser(null)}>Close</button>
              <button onClick={() => { setViewUser(null); viewActivity(viewUser); }}>View Full Activity</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PERMISSIONS ── */}
      {showPermissions && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Role Permissions</h3>
            <p className="um-modal-sub">
              <span className={getRoleBadgeClass(showPermissions.role)}>
                {ROLE_LABELS[showPermissions.role] || showPermissions.role}
              </span>
              &nbsp;— {showPermissions.name || showPermissions.email}
            </p>
            <div className="um-permissions-list">
              {(ROLE_PERMISSIONS[showPermissions.role] || []).map(perm => (
                <div key={perm} className="um-permission-item">
                  <span className="um-perm-check">✓</span>
                  <span>{perm.replace(/_/g," ")}</span>
                </div>
              ))}
            </div>
            <div className="um-rbac-grid">
              <h4>All Roles &amp; Permissions</h4>
              {ALL_ROLES.map(role => (
                <div key={role} className="um-rbac-row">
                  <span className={getRoleBadgeClass(role)}>{ROLE_LABELS[role]}</span>
                  <span className="um-rbac-perms">{(ROLE_PERMISSIONS[role]||[]).join(" · ")}</span>
                </div>
              ))}
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={() => setShowPermissions(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESET PASSWORD EMAIL ── */}
      {resetUser && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Send Password Reset Email</h3>
            {!resetSent ? (
              <>
                <p className="um-modal-sub">
                  A password reset link will be sent to <strong>{resetUser.email}</strong>.
                </p>
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
                <div className="um-modal-actions"><button onClick={closeResetModal}>Close</button></div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: SET PASSWORD ── */}
      {setPasswordUser && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Set New Password</h3>
            <p className="um-modal-sub">Setting a new password for <strong>{setPasswordUser.name || setPasswordUser.email}</strong>.</p>
            {setPwdError && <p className="um-form-error">{setPwdError}</p>}
            <div className="um-form-field">
              <label>New Password</label>
              <div className="um-password-field">
                <input
                  type={showNewPwd?"text":"password"}
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button type="button" className="um-pwd-toggle" onClick={() => setShowNewPwd(v=>!v)}>
                  {showNewPwd?"🙈":"👁"}
                </button>
              </div>
            </div>
            <div className="um-modal-actions">
              <button className="cancel-btn" onClick={closeSetPasswordModal}>Cancel</button>
              <button className="submit-btn" onClick={handleSetPassword} disabled={setPwdLoading||!newPassword}>
                {setPwdLoading?"Updating…":"Set Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE USER ── */}
      {deleteUser && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Delete User</h3>
            <p>
              Permanently delete <strong>{deleteUser.name || deleteUser.email}</strong>?
              This will remove their profile, all exam results, and activity data. This action cannot be undone.
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

      {/* ── MODAL: BULK DELETE ── */}
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
