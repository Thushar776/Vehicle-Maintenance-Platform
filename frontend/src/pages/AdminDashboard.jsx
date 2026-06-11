import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import {
  Users,
  Car,
  Wrench,
  Calendar,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  AlertTriangle,
  Flame,
  CheckSquare
} from 'lucide-react';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users);
    } catch (err) {
      console.error(err.message);
      setToast({ message: 'Failed to retrieve administrator directory', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userToUpdate) => {
    const nextRole = userToUpdate.role === 'admin' ? 'user' : 'admin';
    if (userToUpdate._id === currentUser.id || userToUpdate._id === currentUser._id) {
      setToast({ message: 'You cannot change your own role!', type: 'error' });
      return;
    }

    try {
      const res = await api.put(`/admin/users/${userToUpdate._id}/role`, { role: nextRole });
      if (res.data.success) {
        setToast({ message: `Promoted ${userToUpdate.name} to ${nextRole}`, type: 'success' });
        fetchAdminData();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to modify role', type: 'error' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/admin/users/${selectedUser._id}`);
      if (res.data.success) {
        setToast({ message: 'User account and all associated vehicles/logs deleted', type: 'success' });
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        fetchAdminData();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete user', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (usr) => {
    if (usr._id === currentUser.id || usr._id === currentUser._id) {
      setToast({ message: 'You cannot delete your own account!', type: 'error' });
      return;
    }
    setSelectedUser(usr);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Admin Panel" />

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-slate-100">Platform Analytics</h2>
                <p className="text-xs text-slate-400">Monitor registrations, fleet metrics, and manage user directories</p>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Platform Users"
                  value={stats?.totalUsers || 0}
                  icon={<Users className="h-6 w-6" />}
                  description="Registered accounts"
                />
                <StatCard
                  title="Fleet Vehicles"
                  value={stats?.totalVehicles || 0}
                  icon={<Car className="h-6 w-6" />}
                  description="Registered vehicles"
                />
                <StatCard
                  title="Maintenance Records"
                  value={stats?.totalServices || 0}
                  icon={<Wrench className="h-6 w-6" />}
                  description="Logged repairs"
                />
                <StatCard
                  title="System Appointments"
                  value={stats?.totalAppointments || 0}
                  icon={<Calendar className="h-6 w-6" />}
                  description="Scheduled bookings"
                />
              </div>

              {/* Fuel and status distribution */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Fuel Dist */}
                <div className="glass-card">
                  <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-amber-500" />
                    Fleet Fuel Type Distribution
                  </h3>
                  <div className="space-y-3">
                    {stats?.fuelDistribution && Object.keys(stats.fuelDistribution).map((fuel) => {
                      const count = stats.fuelDistribution[fuel];
                      const pct = stats.totalVehicles > 0 ? Math.round((count / stats.totalVehicles) * 100) : 0;
                      return (
                        <div key={fuel} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">{fuel}</span>
                            <span className="text-slate-200">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-darkBg-850 rounded-full overflow-hidden border border-darkBg-800">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Appointment status Dist */}
                <div className="glass-card">
                  <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-indigo-400" />
                    Appointment Status Ratios
                  </h3>
                  <div className="space-y-3">
                    {stats?.appointmentDistribution && Object.keys(stats.appointmentDistribution).map((status) => {
                      const count = stats.appointmentDistribution[status];
                      const pct = stats.totalAppointments > 0 ? Math.round((count / stats.totalAppointments) * 100) : 0;
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">{status}</span>
                            <span className="text-slate-200">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-darkBg-850 rounded-full overflow-hidden border border-darkBg-800">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Users directory table */}
              <div className="glass-card">
                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-brand-400" />
                  Registered Accounts Directory
                </h3>
                
                <div className="overflow-x-auto rounded-xl border border-darkBg-850 shadow-sm mt-4">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-darkBg-850/50 uppercase tracking-wider text-[10px] font-bold border-b border-darkBg-850 text-slate-400">
                      <tr>
                        <th className="px-6 py-4">User Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role Status</th>
                        <th className="px-6 py-4">Date Registered</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-darkBg-850">
                      {users.map((usr) => (
                        <tr key={usr._id} className="hover:bg-darkBg-850/20 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-200">{usr.name}</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{usr.email}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              usr.role === 'admin'
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                            }`}>
                              {usr.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(usr.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => handleToggleRole(usr)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-darkBg-850 border border-darkBg-800 hover:border-brand-500/20 text-xs font-semibold rounded-lg text-slate-300 hover:text-slate-100 transition-all"
                                title="Toggle Administrator Privilege"
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Toggle Role
                              </button>
                              
                              <button
                                onClick={() => openDeleteModal(usr)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded-lg transition-all"
                                title="Delete user account"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete User account Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm User Deletion">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm leading-relaxed">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <span>
              <strong>Warning:</strong> Deleting this user account will cascade delete all their vehicles, repair timelines, scheduled appointments, and alert notifications. This action is final.
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Are you sure you want to permanently delete <strong>{selectedUser?.name} ({selectedUser?.email})</strong>?
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Deleting Account...' : 'Yes, Delete Account'}
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default AdminDashboard;
