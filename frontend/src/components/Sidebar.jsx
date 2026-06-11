import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  Wrench,
  CalendarDays,
  BarChart3,
  ShieldAlert,
  User,
  LogOut,
  X,
  Gauge
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'My Vehicles', path: '/vehicles', icon: <Car className="h-5 w-5" /> },
    { name: 'Service Logs', path: '/services', icon: <Wrench className="h-5 w-5" /> },
    { name: 'Appointments', path: '/appointments', icon: <CalendarDays className="h-5 w-5" /> },
    { name: 'Insights', path: '/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  if (user && user.role === 'admin') {
    links.push({
      name: 'Admin Panel',
      path: '/admin',
      icon: <ShieldAlert className="h-5 w-5 text-indigo-400" />,
    });
  }

  const activeClass = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600 text-white font-medium shadow-md shadow-brand-500/10 transition-all';
  const inactiveClass = 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-darkBg-850 hover:text-slate-200 transition-all duration-200';

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-darkBg-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-darkBg-850 bg-darkBg-900 px-4 py-6 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and close control */}
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-brand-500 p-2 text-white">
              <Gauge className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">
              Aero<span className="text-brand-500">Keep</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-darkBg-800 hover:text-slate-200 lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
            >
              {link.icon}
              <span className="text-sm">{link.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom User Area */}
        <div className="mt-auto border-t border-darkBg-850 pt-4 px-1 space-y-1.5">
          <NavLink
            to="/profile"
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
          >
            <User className="h-5 w-5" />
            <span className="text-sm">My Profile</span>
          </NavLink>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
