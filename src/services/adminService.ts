export interface ChatOpsUser {
    id: number;
    mobileNumber: string;
    userName: string;
    flowName: string;
    role: string;
    accessLevel: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowConfig {
    id: number;
    uid: string;
    channelId: number;
    botflowId: number | null;
    workflowName: string;
    executionMode: string;
    active: boolean;
    metaData: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminSession {
    mobileNumber: string;
    userName: string;
    accessLevel: string;
}

export interface CreateUserPayload {
    mobileNumber: string;
    userName: string;
    flowName: string;
    accessLevel: string | null;
}

export const ADMIN_SESSION_KEY = 'adminSession';

export const adminService = {
    getSession(): AdminSession | null {
        if (typeof window === 'undefined') return null;
        try {
            const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    setSession(session: AdminSession): void {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    },

    clearSession(): void {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
    },

    isAdmin(session: AdminSession | null): boolean {
        if (!session?.accessLevel) return false;
        const levels = session.accessLevel.split(',').map(s => s.trim());
        return levels.includes('admin');
    },

    async getAllUsers(): Promise<{ data: ChatOpsUser[]; count: number; status: string }> {
        const res = await fetch('/api/admin/users-all', { cache: 'no-store' });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to fetch users');
        }
        return res.json();
    },

    async getActiveWorkflows(): Promise<WorkflowConfig[]> {
        const res = await fetch('/api/admin/workflows', { cache: 'no-store' });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to fetch workflows');
        }
        return res.json();
    },

    async createOrUpdateUser(payload: CreateUserPayload): Promise<{ data: ChatOpsUser; status: string; message: string }> {
        const res = await fetch('/api/admin/user-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to save user');
        }
        return res.json();
    },

    async deactivateUser(mobileNumber: string): Promise<{ status: string; message: string }> {
        const res = await fetch('/api/admin/user-inactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to deactivate user');
        }
        return res.json();
    },
};
