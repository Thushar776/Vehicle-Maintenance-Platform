import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { formatOdometer, formatCost, formatDate } from '../utils/format';
import { Wrench, Search, Filter, Plus, Calendar, Store, Coins } from 'lucide-react';

const ServiceHistory = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data state
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  // Add Service Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Engine Oil');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceOdo, setServiceOdo] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceParts, setServiceParts] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchServicesAndVehicles();
  }, []);

  const fetchServicesAndVehicles = async () => {
    try {
      setLoading(true);
      const [srvRes, vehRes] = await Promise.all([
        api.get('/services'),
        api.get('/vehicles'),
      ]);

      if (srvRes.data.success) setServices(srvRes.data.services);
      if (vehRes.data.success) {
        setVehicles(vehRes.data.vehicles);
        if (vehRes.data.vehicles.length > 0) {
          setSelectedVehicle(vehRes.data.vehicles[0]._id);
        }
      }
    } catch (err) {
      console.error(err.message);
      setToast({ message: 'Failed to load service histories', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !serviceOdo || !serviceDesc || !serviceCost || !serviceCenter) {
      setToast({ message: 'Please complete all required fields', type: 'error' });
      return;
    }

    setFormSubmitting(true);
    try {
      const partsArray = serviceParts
        ? serviceParts.split(',').map((p) => p.trim()).filter((p) => p !== '')
        : [];

      const res = await api.post('/services', {
        vehicle: selectedVehicle,
        serviceDate,
        odometerReading: Number(serviceOdo),
        serviceCategory,
        serviceDescription: serviceDesc,
        partsReplaced: partsArray,
        cost: Number(serviceCost),
        serviceCenter,
        notes: serviceNotes,
      });

      if (res.data.success) {
        setToast({ message: 'Maintenance record logged successfully!', type: 'success' });
        setIsModalOpen(false);
        // Reset form
        setServiceCategory('Engine Oil');
        setServiceDate(new Date().toISOString().split('T')[0]);
        setServiceOdo('');
        setServiceDesc('');
        setServiceParts('');
        setServiceCost('');
        setServiceCenter('');
        setServiceNotes('');
        
        fetchServicesAndVehicles();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to record log', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter mechanics logs
  const filteredServices = services.filter((srv) => {
    // If vehicle populated is full object or ID
    const vehName = srv.vehicle
      ? `${srv.vehicle.manufacturer} ${srv.vehicle.model}`.toLowerCase()
      : '';
    const matchSearch =
      srv.serviceDescription.toLowerCase().includes(search.toLowerCase()) ||
      srv.serviceCenter.toLowerCase().includes(search.toLowerCase()) ||
      vehName.includes(search.toLowerCase());
    
    const matchCategory = categoryFilter === '' || srv.serviceCategory === categoryFilter;
    
    const vehId = srv.vehicle?._id || srv.vehicle;
    const matchVehicle = vehicleFilter === '' || vehId === vehicleFilter;

    return matchSearch && matchCategory && matchVehicle;
  });

  // Calculate sum of costs
  const totalCost = filteredServices.reduce((sum, srv) => sum + srv.cost, 0);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Service Logs" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Service Logs Timeline</h2>
                <p className="text-xs text-slate-400">Review repairs, invoices and replacements history</p>
              </div>
              <button
                disabled={vehicles.length === 0}
                onClick={() => {
                  if (vehicles.length > 0) {
                    setServiceOdo(vehicles[0].currentOdometer);
                    setIsModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-brand-500/10 transition-all self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Log Maintenance Record
              </button>
            </div>

            {/* Quick spend card */}
            <div className="glass-card flex items-center justify-between border-brand-500/10 bg-brand-500/[0.02] py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-500/10 p-2.5 text-brand-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Service Expenses</p>
                  <p className="text-2xl font-bold text-slate-200 mt-0.5">{formatCost(totalCost)}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-semibold px-2 py-1 bg-darkBg-900 border border-darkBg-850 rounded-lg">
                {filteredServices.length} Records
              </span>
            </div>

            {/* Filters */}
            <div className="grid gap-4 sm:grid-cols-3 p-4 bg-white dark:bg-darkBg-900 border border-slate-200 dark:border-darkBg-850 rounded-2xl shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search description or shop..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 dark:border-darkBg-800 dark:bg-darkBg-950 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:border-darkBg-800 dark:bg-darkBg-950 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="">All Categories</option>
                  <option value="Engine Oil">Engine Oil</option>
                  <option value="Brake System">Brake System</option>
                  <option value="Battery">Battery</option>
                  <option value="Coolant">Coolant</option>
                  <option value="Air Filter">Air Filter</option>
                  <option value="Tires">Tires</option>
                  <option value="General Maintenance">General Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:border-darkBg-800 dark:bg-darkBg-950 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.manufacturer} {v.model} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-darkBg-800 rounded-2xl bg-darkBg-900/10">
                <Wrench className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No logs found</p>
                <p className="text-xs text-slate-500 mt-1">Try logging a service or clearing filter variables.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-darkBg-850 shadow-sm bg-white dark:bg-darkBg-900">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-50 text-slate-400 dark:bg-darkBg-850/50 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-darkBg-850">
                    <tr>
                      <th className="px-6 py-4">Service Details</th>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Mileage</th>
                      <th className="px-6 py-4">Service Provider</th>
                      <th className="px-6 py-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-darkBg-850">
                    {filteredServices.map((srv) => (
                      <tr key={srv._id} className="hover:bg-slate-50 dark:hover:bg-darkBg-850/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-slate-100 font-semibold">{srv.serviceCategory}</span>
                            <p className="text-xs text-slate-400 leading-normal mt-1 max-w-sm line-clamp-1">{srv.serviceDescription}</p>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-1">{formatDate(srv.serviceDate)}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 font-semibold text-slate-200">
                          {srv.vehicle ? (
                            <div>
                              <p className="text-sm">{srv.vehicle.manufacturer} {srv.vehicle.model}</p>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{srv.vehicle.registrationNumber}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500">Removed</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 font-semibold text-slate-300">
                          {formatOdometer(srv.odometerReading)}
                        </td>

                        <td className="px-6 py-4 text-slate-400 text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Store className="h-4 w-4 text-slate-500" />
                            {srv.serviceCenter}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-bold text-slate-200">
                          {formatCost(srv.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Log Service Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Repair / Maintenance Record">
        <form onSubmit={handleAddService} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Apply to Vehicle *</label>
              <select
                value={selectedVehicle}
                onChange={(e) => {
                  setSelectedVehicle(e.target.value);
                  const selected = vehicles.find(v => v._id === e.target.value);
                  if (selected) setServiceOdo(selected.currentOdometer);
                }}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.manufacturer} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Category *</label>
              <select
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="Engine Oil">Engine Oil</option>
                <option value="Brake System">Brake System</option>
                <option value="Battery">Battery</option>
                <option value="Coolant">Coolant</option>
                <option value="Air Filter">Air Filter</option>
                <option value="Tires">Tires</option>
                <option value="General Maintenance">General Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Date *</label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Odometer Reading (km) *</label>
              <input
                type="number"
                required
                value={serviceOdo}
                onChange={(e) => setServiceOdo(e.target.value)}
                placeholder="Odometer when serviced"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description *</label>
              <input
                type="text"
                required
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="e.g. Engine oil and filter replaced"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parts Replaced (comma separated)</label>
              <input
                type="text"
                value={serviceParts}
                onChange={(e) => setServiceParts(e.target.value)}
                placeholder="e.g. Engine Oil, Oil Filter"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost ($ USD) *</label>
              <input
                type="number"
                required
                value={serviceCost}
                onChange={(e) => setServiceCost(e.target.value)}
                placeholder="Total invoice cost"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Center *</label>
              <input
                type="text"
                required
                value={serviceCenter}
                onChange={(e) => setServiceCenter(e.target.value)}
                placeholder="e.g. Express Lube"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</label>
              <textarea
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                placeholder="Additional mechanics observations..."
                rows="2"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {formSubmitting ? 'Logging...' : 'Save Log'}
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default ServiceHistory;
