'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adminService, ChatOpsUser, WorkflowConfig, CreateUserPayload } from '@/services/adminService';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div style={{
            position: 'fixed', top: '1.2rem', right: '1.2rem', zIndex: 9999,
            background: type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
            color: '#fff', borderRadius: '10px', padding: '0.75rem 1.2rem',
            fontWeight: 600, fontSize: '0.88rem', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '340px',
            animation: 'slideIn 0.25s ease'
        }}>
            {type === 'success' ? '✓' : '⚠'} {msg}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}
function Modal({ title, onClose, children }: ModalProps) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }} onClick={onClose}>
            <div style={{
                background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px',
                boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── User Form ────────────────────────────────────────────────────────────────
interface UserFormProps {
    initial?: Partial<CreateUserPayload>;
    workflows: WorkflowConfig[];
    onSave: (p: CreateUserPayload) => Promise<void>;
    onClose: () => void;
    saving: boolean;
    isEdit: boolean;
}
function UserForm({ initial, workflows, onSave, onClose, saving, isEdit }: UserFormProps) {
    const [mobile, setMobile] = useState(initial?.mobileNumber ?? '');
    const [name, setName] = useState(initial?.userName ?? '');
    const [flow, setFlow] = useState(initial?.flowName ?? '');
    const [hasCancel, setHasCancel] = useState(
        (initial?.accessLevel || '').split(',').map(s => s.trim()).includes('cancel_discharge')
    );

    const hasAdmin = (initial?.accessLevel || '').split(',').map(s => s.trim()).includes('admin');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const roles = [];
        if (hasCancel) roles.push('cancel_discharge');
        if (hasAdmin) roles.push('admin');
        const finalAccessLevel = roles.length > 0 ? roles.join(',') : 'none';
        onSave({ mobileNumber: mobile, userName: name, flowName: flow, accessLevel: finalAccessLevel });
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        padding: '0.7rem 0.9rem', color: '#f1f5f9', fontSize: '0.92rem',
        outline: 'none', boxSizing: 'border-box',
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.75rem', fontWeight: 600,
        color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label style={labelStyle}>Mobile Number</label>
                <input style={inputStyle} type="text" inputMode="numeric" maxLength={10}
                    value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit number" required disabled={isEdit} />
            </div>
            <div>
                <label style={labelStyle}>User Name</label>
                <input style={inputStyle} type="text" value={name}
                    onChange={e => setName(e.target.value)} placeholder="Full name" required />
            </div>
            <div>
                <label style={labelStyle}>Workflow</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={flow}
                    onChange={e => setFlow(e.target.value)} required>
                    <option value="">Select a workflow...</option>
                    {workflows.map(w => (
                        <option key={w.id} value={w.workflowName}>{w.workflowName}</option>
                    ))}
                </select>
            </div>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '10px', padding: '0.9rem 1rem'
            }}>
                <input id="cancelDischarge" type="checkbox" checked={hasCancel}
                    onChange={e => setHasCancel(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }} />
                <label htmlFor="cancelDischarge" style={{ color: '#c7d2fe', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>
                    Grant <strong>cancel_discharge</strong> permission
                </label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={onClose} style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '0.75rem', color: '#94a3b8', fontWeight: 600, cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" disabled={saving} style={{
                    flex: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', borderRadius: '8px', padding: '0.75rem', color: '#fff',
                    fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1
                }}>
                    {saving ? '⏳ Saving...' : isEdit ? '✓ Update User' : '+ Add User'}
                </button>
            </div>
        </form>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${active ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: '20px', padding: '0.25rem 0.7rem',
            color: active ? '#34d399' : '#f87171', fontSize: '0.75rem', fontWeight: 600
        }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? '#34d399' : '#f87171', display: 'inline-block' }} />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

// ─── Access Badge ─────────────────────────────────────────────────────────────
function AccessBadge({ level }: { level: string | null }) {
    if (!level) return <span style={{ color: '#475569', fontSize: '0.8rem' }}>—</span>;
    return (
        <span style={{
            display: 'inline-block', background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px',
            padding: '0.2rem 0.55rem', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600
        }}>
            {level}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const router = useRouter();
    const [session, setSession] = useState<ReturnType<typeof adminService.getSession>>(null);
    const [users, setUsers] = useState<ChatOpsUser[]>([]);
    const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [saving, setSaving] = useState(false);
    const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

    // Modal state
    const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
    const [editTarget, setEditTarget] = useState<ChatOpsUser | null>(null);
    const [confirmDeactivate, setConfirmDeactivate] = useState<ChatOpsUser | null>(null);

    // Search
    const [search, setSearch] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
    const [workflowFilter, setWorkflowFilter] = useState<string>('all');

    const workflowOptions = useMemo(() => {
        const set = new Set<string>();
        workflows.forEach(w => { if (w.workflowName) set.add(w.workflowName); });
        users.forEach(u => { if (u.flowName) set.add(u.flowName); });
        return Array.from(set).sort();
    }, [workflows, users]);

    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, workflowsRes] = await Promise.all([
                adminService.getAllUsers(),
                adminService.getActiveWorkflows(),
            ]);
            setUsers(usersRes.data || []);
            setWorkflows(workflowsRes || []);
        } catch (err) {
            showToast((err as Error).message || 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const s = adminService.getSession();
        if (!s || !adminService.isAdmin(s)) {
            router.replace('/admin/users/login');
            return;
        }
        setSession(s);
        fetchData();
    }, [router, fetchData]);

    const handleSaveUser = async (payload: CreateUserPayload) => {
        setSaving(true);
        try {
            const isNew = modalMode === 'add';
            await adminService.createOrUpdateUser({ ...payload, isNew });
            showToast(isNew ? 'User added successfully!' : 'User updated successfully!', 'success');
            setModalMode(null);
            setEditTarget(null);
            await fetchData();
        } catch (err) {
            showToast((err as Error).message || 'Failed to save user', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (user: ChatOpsUser) => {
        setDeactivatingId(user.id);
        setConfirmDeactivate(null);
        try {
            await adminService.deactivateUser(user.mobileNumber);
            showToast(`${user.userName} has been deactivated.`, 'success');
            await fetchData();
        } catch (err) {
            showToast((err as Error).message || 'Failed to deactivate user', 'error');
        } finally {
            setDeactivatingId(null);
        }
    };

    const handleLogout = () => {
        adminService.clearSession();
        router.replace('/admin/users/login');
    };

    const filtered = users.filter(u => {
        const matchesSearch = !search ||
            u.userName?.toLowerCase().includes(search.toLowerCase()) ||
            u.mobileNumber?.includes(search) ||
            u.flowName?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && u.isActive) ||
            (statusFilter === 'inactive' && !u.isActive);

        const matchesWorkflow =
            workflowFilter === 'all' ||
            u.flowName === workflowFilter;

        return matchesSearch && matchesStatus && matchesWorkflow;
    });

    if (!session) return null;

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2027 100%)', fontFamily: "'Inter','Segoe UI',sans-serif", color: '#f1f5f9' }}>
            <style>{`
                @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
                @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                .admin-row:hover td { background: rgba(99,102,241,0.06) !important; }
                .action-btn { transition: opacity 0.15s, transform 0.15s !important; }
                .action-btn:hover { opacity: 0.85 !important; transform: translateY(-1px) !important; }
                select option { background: #1e2a3a; color: #f1f5f9; }
            `}</style>

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '1rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🛡️</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>User Management</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ChatOps Admin Portal</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#a5b4fc' }}>{session.userName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#475569' }}>{session.mobileNumber}</div>
                        </div>
                        <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.45rem 0.9rem', color: '#f87171', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', animation: 'fadeIn 0.3s ease' }}>

                {/* Stats bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Users', value: users.length, icon: '👥', color: '#6366f1' },
                        { label: 'Active', value: users.filter(u => u.isActive).length, icon: '✅', color: '#10b981' },
                        { label: 'Inactive', value: users.filter(u => !u.isActive).length, icon: '⛔', color: '#ef4444' },
                        { label: 'Workflows', value: workflows.length, icon: '⚙️', color: '#f59e0b' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.icon} {s.label}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text" placeholder="🔍  Search by name, mobile, or workflow..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, minWidth: '220px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.65rem 1rem', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none' }}
                    />
                    
                    {/* Workflow Filter Dropdown */}
                    <select
                        id="workflowFilter"
                        value={workflowFilter}
                        onChange={e => setWorkflowFilter(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            padding: '0.65rem 1rem',
                            color: '#f1f5f9',
                            fontSize: '0.88rem',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '180px',
                            maxWidth: '220px'
                        }}
                    >
                        <option value="all">📂 All Workflows</option>
                        {workflowOptions.map(flow => (
                            <option key={flow} value={flow}>{flow}</option>
                        ))}
                    </select>

                    {/* Status Filter Dropdown */}
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            padding: '0.65rem 1rem',
                            color: '#f1f5f9',
                            fontSize: '0.88rem',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '150px'
                        }}
                    >
                        <option value="active">🟢 Active Users</option>
                        <option value="inactive">🔴 Inactive Users</option>
                        <option value="all">👁️ All Statuses</option>
                    </select>

                    <button
                        id="addUserBtn"
                        onClick={() => { setEditTarget(null); setModalMode('add'); }}
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', padding: '0.65rem 1.2rem', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
                    >
                        + Add User
                    </button>
                    <button
                        onClick={fetchData}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.65rem 1rem', color: '#94a3b8', fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                        ↻ Refresh
                    </button>
                </div>

                {/* Table */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#475569' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
                            Loading users...
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {['#', 'Name', 'Mobile', 'Workflow', 'Access Level', 'Status', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', background: 'rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#475569', background: 'transparent' }}>
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : filtered.map((user, i) => (
                                        <tr key={user.id} className="admin-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                                            <td style={{ padding: '0.9rem 1rem', color: '#475569', fontSize: '0.82rem', background: 'transparent' }}>{i + 1}</td>
                                            <td style={{ padding: '0.9rem 1rem', background: 'transparent' }}>
                                                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{user.userName}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</div>
                                            </td>
                                            <td style={{ padding: '0.9rem 1rem', color: '#94a3b8', fontSize: '0.87rem', fontFamily: 'monospace', background: 'transparent' }}>{user.mobileNumber}</td>
                                            <td style={{ padding: '0.9rem 1rem', background: 'transparent' }}>
                                                <span style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '6px', padding: '0.2rem 0.6rem', color: '#c7d2fe', fontSize: '0.8rem', maxWidth: '200px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {user.flowName || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.9rem 1rem', background: 'transparent' }}>
                                                <AccessBadge level={user.accessLevel} />
                                            </td>
                                            <td style={{ padding: '0.9rem 1rem', background: 'transparent' }}>
                                                <StatusBadge active={user.isActive} />
                                            </td>
                                            <td style={{ padding: '0.9rem 1rem', background: 'transparent' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="action-btn"
                                                        id={`editUser${user.id}`}
                                                        onClick={() => { setEditTarget(user); setModalMode('edit'); }}
                                                        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '7px', padding: '0.4rem 0.75rem', color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    {user.isActive && (
                                                        <button
                                                            className="action-btn"
                                                            id={`deactivateUser${user.id}`}
                                                            disabled={deactivatingId === user.id}
                                                            onClick={() => setConfirmDeactivate(user)}
                                                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '7px', padding: '0.4rem 0.75rem', color: '#f87171', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', opacity: deactivatingId === user.id ? 0.5 : 1 }}
                                                        >
                                                            {deactivatingId === user.id ? '⏳' : '⛔ Deactivate'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && (
                        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)', color: '#475569', fontSize: '0.78rem' }}>
                            Showing {filtered.length} of {users.length} users
                        </div>
                    )}
                </div>
            </div>

            {/* Add / Edit Modal */}
            {modalMode && (
                <Modal
                    title={modalMode === 'add' ? 'Add New User' : `Edit — ${editTarget?.userName}`}
                    onClose={() => { setModalMode(null); setEditTarget(null); }}
                >
                    <UserForm
                        isEdit={modalMode === 'edit'}
                        initial={editTarget ? { mobileNumber: editTarget.mobileNumber, userName: editTarget.userName, flowName: editTarget.flowName, accessLevel: editTarget.accessLevel } : undefined}
                        workflows={workflows}
                        onSave={handleSaveUser}
                        onClose={() => { setModalMode(null); setEditTarget(null); }}
                        saving={saving}
                    />
                </Modal>
            )}

            {/* Confirm Deactivate Modal */}
            {confirmDeactivate && (
                <Modal title="Confirm Deactivate" onClose={() => setConfirmDeactivate(null)}>
                    <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Are you sure you want to deactivate <strong style={{ color: '#f1f5f9' }}>{confirmDeactivate.userName}</strong> ({confirmDeactivate.mobileNumber})?
                        They will no longer be able to log in.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setConfirmDeactivate(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem', color: '#94a3b8', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button
                            onClick={() => handleDeactivate(confirmDeactivate)}
                            style={{ flex: 1, background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                        >
                            ⛔ Deactivate
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
