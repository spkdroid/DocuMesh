import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { UserGroup, Permission, OrgUser } from '../types';
import './Team.css';

type Tab = 'members' | 'groups' | 'permissions';

export default function Team() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('members');

  /* Members */
  const [members, setMembers] = useState<OrgUser[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('reviewer');
  const [inviting, setInviting] = useState(false);

  /* Groups */
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [addMemberId, setAddMemberId] = useState('');

  /* Permissions */
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleFilter, setRoleFilter] = useState('');

  const [loading, setLoading] = useState(true);

  /* ── Fetch members from /users endpoint (org-scoped) ── */
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<OrgUser[]>('/users');
      setMembers(data);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<UserGroup[]>('/access-control/groups');
      setGroups(data);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get<Permission[]>('/access-control/permissions', { params });
      setPermissions(data);
    } catch { /* */ } finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => {
    if (tab === 'members') fetchMembers();
    else if (tab === 'groups') fetchGroups();
    else if (tab === 'permissions') fetchPermissions();
  }, [tab, fetchMembers, fetchGroups, fetchPermissions]);

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      await api.post('/access-control/groups', { name: groupName, description: groupDesc });
      setGroupName('');
      setGroupDesc('');
      setShowCreateGroup(false);
      fetchGroups();
    } catch {
      alert('Failed to create group');
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    await api.delete(`/access-control/groups/${id}`);
    fetchGroups();
  };

  const expandGroup = async (id: string) => {
    if (expandedGroup === id) { setExpandedGroup(null); return; }
    try {
      const { data } = await api.get<UserGroup>(`/access-control/groups/${id}`);
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, members: data.members } : g)));
      setExpandedGroup(id);
    } catch { /* */ }
  };

  const addMemberToGroup = async (groupId: string) => {
    if (!addMemberId.trim()) return;
    try {
      await api.post(`/access-control/groups/${groupId}/members`, { userIds: [addMemberId] });
      setAddMemberId('');
      expandGroup(groupId);
    } catch {
      alert('Failed to add member. Make sure the user ID is correct.');
    }
  };

  const removeMember = async (groupId: string, userId: string) => {
    await api.delete(`/access-control/groups/${groupId}/members/${userId}`);
    expandGroup(groupId);
  };

  const seedPermissions = async () => {
    try {
      await api.post('/access-control/permissions/seed');
      fetchPermissions();
    } catch {
      alert('Failed to seed permissions');
    }
  };

  return (
    <div className="team-page">
      <div className="page-header">
        <div>
          <h1>Team &amp; Access Control</h1>
          <p className="text-secondary">
            Manage users, groups, roles, and permissions
          </p>
        </div>
      </div>

      <div className="team-tabs">
        <button className={`tab-btn ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
          Members
        </button>
        <button className={`tab-btn ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>
          Groups
        </button>
        <button className={`tab-btn ${tab === 'permissions' ? 'active' : ''}`} onClick={() => setTab('permissions')}>
          Permissions
        </button>
      </div>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : (
        <>
          {/* ── Members ── */}
          {tab === 'members' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <button className="btn btn-primary" onClick={() => setShowInvite(!showInvite)}>
                  + Invite Member
                </button>
              </div>

              {showInvite && (
                <div className="create-card" style={{ marginBottom: 16 }}>
                  <h3>Invite Team Member</h3>
                  <p className="text-secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                    Create a new account in your organization. Share the credentials with the invitee.
                  </p>
                  <div className="create-form">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Display name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Initial password (min 8 chars)"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                    />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                      <option value="admin">Admin</option>
                      <option value="author">Author</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <div className="create-actions">
                      <button className="btn btn-secondary" onClick={() => setShowInvite(false)}>
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={inviting || !inviteEmail.trim() || !inviteName.trim() || invitePassword.length < 8}
                        onClick={async () => {
                          setInviting(true);
                          try {
                            await api.post('/users/invite', {
                              email: inviteEmail,
                              displayName: inviteName,
                              password: invitePassword,
                              role: inviteRole,
                            });
                            setInviteEmail('');
                            setInviteName('');
                            setInvitePassword('');
                            setInviteRole('reviewer');
                            setShowInvite(false);
                            fetchMembers();
                          } catch {
                            alert('Failed to invite user. The email may already be in use.');
                          } finally {
                            setInviting(false);
                          }
                        }}
                      >
                        {inviting ? 'Inviting...' : 'Invite'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {members.length === 0 ? (
                <div className="empty-state">
                  <p>No team members found.</p>
                  <p className="text-secondary" style={{ fontSize: 13 }}>
                    Invite members to start collaborating.
                  </p>
                </div>
              ) : (
                <table className="content-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td className="title-cell">{m.displayName}</td>
                        <td className="text-secondary">{m.email}</td>
                        <td><span className="badge badge-draft">{m.role}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="current-user-card">
                <h4>Your Account</h4>
                <div className="user-detail-grid">
                  <div><span className="text-secondary">Name</span><br />{user?.displayName}</div>
                  <div><span className="text-secondary">Email</span><br />{user?.email}</div>
                  <div><span className="text-secondary">Role</span><br /><span className="badge badge-draft">{user?.role}</span></div>
                  <div><span className="text-secondary">Org</span><br />{user?.organizationName}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Groups ── */}
          {tab === 'groups' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <button className="btn btn-primary" onClick={() => setShowCreateGroup(!showCreateGroup)}>
                  + New Group
                </button>
              </div>

              {showCreateGroup && (
                <div className="create-card" style={{ marginBottom: 16 }}>
                  <h3>Create Group</h3>
                  <div className="create-form">
                    <input
                      type="text"
                      placeholder="Group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                    />
                    <div className="create-actions">
                      <button className="btn btn-secondary" onClick={() => setShowCreateGroup(false)}>Cancel</button>
                      <button className="btn btn-primary" onClick={createGroup} disabled={!groupName.trim()}>Create</button>
                    </div>
                  </div>
                </div>
              )}

              {groups.length === 0 ? (
                <div className="empty-state">
                  <p>No groups yet.</p>
                </div>
              ) : (
                <div className="group-list">
                  {groups.map((g) => (
                    <div key={g.id} className="group-card">
                      <div className="group-row" onClick={() => expandGroup(g.id)} style={{ cursor: 'pointer' }}>
                        <div className="group-info">
                          <span className="pub-expand">{expandedGroup === g.id ? '▾' : '▸'}</span>
                          <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</h3>
                            {g.description && <span className="text-secondary" style={{ fontSize: 12 }}>{g.description}</span>}
                          </div>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); deleteGroup(g.id); }}>
                          Delete
                        </button>
                      </div>

                      {expandedGroup === g.id && (
                        <div className="group-members">
                          <div className="add-member-row">
                            <input
                              type="text"
                              placeholder="User ID to add..."
                              value={addMemberId}
                              onChange={(e) => setAddMemberId(e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => addMemberToGroup(g.id)} disabled={!addMemberId.trim()}>
                              Add Member
                            </button>
                          </div>
                          {(!g.members || g.members.length === 0) ? (
                            <p className="text-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>No members in this group.</p>
                          ) : (
                            <table className="entries-table">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Email</th>
                                  <th>Role</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.members.map((m) => (
                                  <tr key={m.id}>
                                    <td>{m.displayName}</td>
                                    <td className="text-secondary">{m.email}</td>
                                    <td><span className="badge badge-draft">{m.role}</span></td>
                                    <td>
                                      <button className="btn btn-danger btn-sm" onClick={() => removeMember(g.id, m.id)}>
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Permissions ── */}
          {tab === 'permissions' && (
            <div>
              <div className="perm-toolbar">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="author">Author</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button className="btn btn-secondary" onClick={seedPermissions}>
                  Seed Default Permissions
                </button>
              </div>

              {permissions.length === 0 ? (
                <div className="empty-state">
                  <p>No permissions configured.</p>
                  <p className="text-secondary" style={{ fontSize: 13 }}>
                    Click "Seed Default Permissions" to set up standard RBAC rules.
                  </p>
                </div>
              ) : (
                <table className="content-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Resource</th>
                      <th>Action</th>
                      <th>Allowed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((p) => (
                      <tr key={p.id}>
                        <td><span className="badge badge-draft">{p.role}</span></td>
                        <td>{p.resource}</td>
                        <td>{p.action}</td>
                        <td>
                          <span className={`badge ${p.allowed ? 'badge-published' : 'badge-archived'}`}>
                            {p.allowed ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
