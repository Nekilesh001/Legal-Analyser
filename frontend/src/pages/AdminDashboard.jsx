import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import BentoCard from '../components/BentoCard';
import { adminGetSummary, adminListUsers, adminToggleUser, adminSetRole, adminGetUserContracts } from '../api/client';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => adminGetSummary().then(res => res.data),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminListUsers().then(res => res.data),
  });

  const { data: userContracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ['admin-user-contracts', selectedUser?.id],
    queryFn: () => adminGetUserContracts(selectedUser.id).then(res => res.data),
    enabled: !!selectedUser,
  });

  const loading = loadingSummary || loadingUsers;

  const handleToggleActive = async (userId) => {
    setActionLoading(true);
    try {
      await adminToggleUser(userId);
      await queryClient.invalidateQueries(['admin-users']);
      await queryClient.invalidateQueries(['admin-summary']);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetRole = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await adminSetRole(userId, newRole);
      await queryClient.invalidateQueries(['admin-users']);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewContracts = (user) => {
    setSelectedUser(user);
  };

  const textColor = '#E8F4FD';
  const mutedColor = '#8BAFC8';

  return (
    <Layout dark title="Admin Dashboard">
      {/* Platform stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Users', value: summary?.total_users || 0, icon: '👥' },
          { label: 'Total Contracts', value: summary?.total_contracts || 0, icon: '📄' },
          { label: 'Total Analyses', value: summary?.total_analyses || 0, icon: '🔍' },
          { label: 'Platform Avg Score', value: summary?.platform_avg_health_score || '—', icon: '💚' },
        ].map(({ label, value, icon }) => (
          <BentoCard key={label} title={label} icon={icon} dark>
            <div style={{ fontSize: '40px', fontWeight: 900, color: textColor, lineHeight: 1 }}>{value}</div>
          </BentoCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>
        {/* Users table */}
        <BentoCard title="All Users" icon="👥" subtitle={`${users.length} registered`} dark>
          {loading ? (
            <p style={{ color: mutedColor }}>Loading...</p>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['ID', 'Username', 'Email', 'Role', 'Status', 'Contracts', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
                        color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.04)', position: 'sticky', top: 0,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 14px', color: mutedColor }}>#{u.id}</td>
                      <td style={{ padding: '10px 14px', color: textColor, fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: '10px 14px', color: mutedColor, fontSize: '12px' }}>{u.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          value={u.role}
                          onChange={e => handleSetRole(u.id, e.target.value)}
                          disabled={actionLoading}
                          style={{
                            padding: '3px 8px', borderRadius: '8px', border: '1px solid rgba(65,192,242,0.25)',
                            background: 'rgba(10,22,40,0.80)', color: u.role === 'admin' ? '#41C0F2' : textColor,
                            fontSize: '12px', cursor: 'pointer',
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                          background: u.is_active ? 'rgba(46,204,113,0.18)' : 'rgba(255,77,106,0.18)',
                          color: u.is_active ? '#2ECC71' : '#FF4D6A',
                        }}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: textColor }}>{u.contract_count}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleViewContracts(u)} style={{
                            padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(65,192,242,0.25)',
                            background: 'rgba(65,192,242,0.10)', color: '#41C0F2', fontSize: '11px', cursor: 'pointer',
                          }}>
                            View
                          </button>
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            disabled={actionLoading}
                            style={{
                              padding: '4px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer',
                              border: `1px solid ${u.is_active ? 'rgba(255,77,106,0.25)' : 'rgba(46,204,113,0.25)'}`,
                              background: u.is_active ? 'rgba(255,77,106,0.10)' : 'rgba(46,204,113,0.10)',
                              color: u.is_active ? '#FF4D6A' : '#2ECC71',
                            }}
                          >
                            {u.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>

        {/* User contracts panel */}
        <BentoCard title={selectedUser ? `${selectedUser.username}'s Contracts` : 'Select a User'} icon="📋" dark>
          {!selectedUser ? (
            <p style={{ color: mutedColor, fontSize: '13px', textAlign: 'center', padding: '24px' }}>
              Click "View" on a user to see their contracts
            </p>
          ) : loadingContracts ? (
            <p style={{ color: mutedColor, fontSize: '13px', textAlign: 'center', padding: '24px' }}>Loading contracts...</p>
          ) : userContracts.length === 0 ? (
            <p style={{ color: mutedColor, fontSize: '13px', textAlign: 'center', padding: '24px' }}>No contracts</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {userContracts.map(c => (
                <div key={c.id} style={{
                  padding: '10px 14px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '12px', color: textColor }}>{c.filename}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: mutedColor }}>
                    {c.contract_type} · Score: {c.analysis?.health_score != null ? `${c.analysis.health_score}` : 'Pending'} · {new Date(c.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </BentoCard>
      </div>
    </Layout>
  );
}
