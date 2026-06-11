import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import HealthWidget from '../components/HealthWidget';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { formatOdometer, formatCost, formatDate, getPriorityColor } from '../utils/format';
import {
  Car,
  Wrench,
  Calendar,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Settings2,
  FileText,
  Activity,
  History,
  AlertTriangle,
  Coins,
  Store
} from 'lucide-react';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [vehicle, setVehicle] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOdoModalOpen, setIsOdoModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Edit Vehicle Form State
  const [editManufacturer, setEditManufacturer] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editVariant, setEditVariant] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editFuelType, setEditFuelType] = useState('Petrol');
  const [editVehicleType, setEditVehicleType] = useState('Sedan');
  
  // Odo Update Form State
  const [newOdo, setNewOdo] = useState('');

  // Service Record Form State
  const [serviceCategory, setServiceCategory] = useState('Engine Oil');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceOdo, setServiceOdo] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceParts, setServiceParts] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vehicles/${id}`);
      if (res.data.success) {
        setVehicle(res.data.vehicle);
        setPrediction(res.data.prediction);
        setServices(res.data.services);

        // Prepopulate edit form
        setEditManufacturer(res.data.vehicle.manufacturer);
        setEditModel(res.data.vehicle.model);
        setEditVariant(res.data.vehicle.variant || '');
        setEditYear(res.data.vehicle.year);
        setEditFuelType(res.data.vehicle.fuelType);
        setEditVehicleType(res.data.vehicle.vehicleType);
        setNewOdo(res.data.vehicle.currentOdometer);
        setServiceOdo(res.data.vehicle.currentOdometer);
      }
    } catch (err) {
      console.error(err.message);
      setToast({ message: 'Failed to fetch vehicle information', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/vehicles/${id}`, {
        manufacturer: editManufacturer,
        model: editModel,
        variant: editVariant,
        year: Number(editYear),
        fuelType: editFuelType,
        vehicleType: editVehicleType,
      });

      if (res.data.success) {
        setToast({ message: 'Vehicle details updated!', type: 'success' });
        setIsEditModalOpen(false);
        fetchVehicleDetails();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOdometer = async (e) => {
    e.preventDefault();
    if (Number(newOdo) < vehicle.currentOdometer) {
      setToast({ message: 'New mileage cannot be less than current reading', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/vehicles/${id}`, {
        currentOdometer: Number(newOdo),
      });

      if (res.data.success) {
        setToast({ message: 'Odometer reading updated!', type: 'success' });
        setIsOdoModalOpen(false);
        fetchVehicleDetails();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async () => {
    setSubmitting(true);
    try {
      const res = await api.delete(`/vehicles/${id}`);
      if (res.data.success) {
        navigate('/vehicles');
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete vehicle', type: 'error' });
      setSubmitting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleAddServiceRecord = async (e) => {
    e.preventDefault();
    if (!serviceOdo || !serviceDesc || !serviceCost || !serviceCenter) {
      setToast({ message: 'Please complete all required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      // Split parts from comma separated string into array
      const partsArray = serviceParts
        ? serviceParts.split(',').map((p) => p.trim()).filter((p) => p !== '')
        : [];

      const res = await api.post('/services', {
        vehicle: id,
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
        setToast({ message: 'Service log recorded. Engine calculations recalculated!', type: 'success' });
        setIsServiceModalOpen(false);
        
        // Reset form
        setServiceCategory('Engine Oil');
        setServiceDate(new Date().toISOString().split('T')[0]);
        setServiceDesc('');
        setServiceParts('');
        setServiceCost('');
        setServiceCenter('');
        setServiceNotes('');
        
        fetchVehicleDetails();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to record service', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openLogServiceForCategory = (cat) => {
    setServiceCategory(cat);
    setServiceOdo(vehicle.currentOdometer);
    setIsServiceModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Vehicle Health Inspector" />

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : !vehicle ? (
            <div className="text-center py-20">
              <p className="text-slate-400">Vehicle not found.</p>
              <Link to="/vehicles" className="mt-4 text-brand-500 hover:underline inline-block">Back to Vehicles</Link>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
              {/* Back controls and actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Link
                  to="/vehicles"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Fleet
                </Link>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsOdoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-darkBg-900 hover:bg-darkBg-850 border border-darkBg-850 hover:border-brand-500/20 text-slate-200 text-xs font-semibold rounded-xl transition-all shadow-sm"
                  >
                    <Activity className="h-4 w-4 text-brand-400" />
                    Update Odometer
                  </button>
                  
                  <button
                    onClick={() => setIsServiceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Log Repair Record
                  </button>

                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 bg-darkBg-900 border border-darkBg-850 hover:border-brand-500/20 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
                    title="Edit vehicle details"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-2 bg-darkBg-900 border border-darkBg-850 hover:border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-colors"
                    title="Delete vehicle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Main Panels */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left side: Vehicle Specs & Health score */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                  {/* Summary Card */}
                  <div className="glass-card">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="rounded-2xl bg-brand-500/10 p-3.5 text-brand-400 border border-brand-500/25">
                        <Car className="h-7 w-7" />
                      </div>
                      <div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-darkBg-800 rounded-md text-slate-400 border border-slate-200/50 dark:border-darkBg-750 uppercase">
                          {vehicle.registrationNumber}
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-200 mt-1">
                          {vehicle.manufacturer} {vehicle.model}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{vehicle.variant || 'Standard Variant'}</p>
                      </div>
                    </div>

                    {/* Specs list */}
                    <div className="space-y-3 mt-6 pt-6 border-t border-darkBg-850 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Year Model</span>
                        <span className="font-semibold text-slate-300">{vehicle.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fuel Type</span>
                        <span className="font-semibold text-slate-300">{vehicle.fuelType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Classification</span>
                        <span className="font-semibold text-slate-300">{vehicle.vehicleType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Purchase Date</span>
                        <span className="font-semibold text-slate-300">{formatDate(vehicle.purchaseDate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-t border-darkBg-850 mt-4">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Current Odometer</span>
                        <span className="font-extrabold text-base text-brand-400">{formatOdometer(vehicle.currentOdometer)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Health gauge card */}
                  <div className="glass-card">
                    <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-brand-400" />
                      Overall Health Score
                    </h3>
                    {prediction ? (
                      <HealthWidget score={prediction.healthScore} />
                    ) : (
                      <div className="flex h-36 items-center justify-center">
                        <span className="text-slate-500 text-xs">Awaiting predictions...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Component lists & timelines */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                  {/* Predictions List */}
                  <div className="glass-card">
                    <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-brand-400" />
                      Predictive Maintenance Diagnostics
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {prediction?.predictions?.map((pred) => (
                        <div
                          key={pred._id}
                          className="p-4 rounded-xl border border-darkBg-850 bg-darkBg-900 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-sm text-slate-200">{pred.category}</h4>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                                pred.status === 'Overdue'
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  : pred.status === 'Due Soon'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              }`}>
                                {pred.status}
                              </span>
                            </div>

                            <div className="space-y-1 mt-2 text-xs text-slate-400 font-medium">
                              <div className="flex justify-between">
                                <span>Remaining Distance:</span>
                                <span className={pred.remainingDistance <= 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                  {pred.remainingDistance <= 0 ? 'Overdue' : `${pred.remainingDistance.toLocaleString()} km`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Remaining Days:</span>
                                <span className={pred.remainingDays <= 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                  {pred.remainingDays <= 0 ? 'Overdue' : `${pred.remainingDays} days`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-darkBg-850 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">
                              Priority index: {pred.priorityScore}%
                            </span>
                            <button
                              onClick={() => openLogServiceForCategory(pred.category)}
                              className="text-[10px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                            >
                              <Wrench className="h-3 w-3" /> Log Service
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* History timelines */}
                  <div className="glass-card">
                    <h3 className="font-bold text-slate-100 mb-6 flex items-center gap-2">
                      <History className="h-5 w-5 text-brand-400" />
                      Maintenance Log History
                    </h3>

                    {services.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-darkBg-800 rounded-xl bg-darkBg-900/10">
                        <FileText className="h-8 w-8 text-slate-600 mb-2" />
                        <p className="text-xs text-slate-500">No repair logs recorded for this vehicle</p>
                        <button
                          onClick={() => setIsServiceModalOpen(true)}
                          className="mt-3 text-xs font-semibold text-brand-400 hover:underline"
                        >
                          Log First Service
                        </button>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-darkBg-800 ml-3.5 space-y-6">
                        {services.map((srv) => (
                          <div key={srv._id} className="relative pl-7 group">
                            {/* Bullet Circle */}
                            <div className="absolute -left-2.5 top-1 h-5 w-5 rounded-full bg-darkBg-900 border-2 border-brand-500 flex items-center justify-center">
                              <Wrench className="h-2.5 w-2.5 text-brand-400" />
                            </div>

                            <div className="p-4 rounded-xl border border-darkBg-850 bg-darkBg-900/40 hover:bg-darkBg-900/70 transition-all">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                <div className="flex items-center gap-2.5">
                                  <h4 className="font-bold text-slate-200 text-sm">{srv.serviceCategory}</h4>
                                  <span className="text-[10px] font-semibold text-slate-500">• {formatOdometer(srv.odometerReading)}</span>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {formatDate(srv.serviceDate)}
                                </span>
                              </div>

                              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                {srv.serviceDescription}
                              </p>

                              {srv.partsReplaced?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Parts:</span>
                                  {srv.partsReplaced.map((part, pidx) => (
                                    <span key={pidx} className="text-[9px] font-medium px-2 py-0.5 bg-darkBg-850 rounded border border-darkBg-800 text-slate-300">
                                      {part}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-4 pt-3 border-t border-darkBg-850 flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Store className="h-3.5 w-3.5" /> {srv.serviceCenter}
                                </span>
                                <span className="flex items-center gap-1 font-bold text-slate-300">
                                  <Coins className="h-3.5 w-3.5 text-brand-400" /> {formatCost(srv.cost)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Vehicle Details Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Vehicle Details">
        <form onSubmit={handleEditVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manufacturer *</label>
              <input
                type="text"
                required
                value={editManufacturer}
                onChange={(e) => setEditManufacturer(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model *</label>
              <input
                type="text"
                required
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Variant</label>
              <input
                type="text"
                value={editVariant}
                onChange={(e) => setEditVariant(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Year Model *</label>
              <input
                type="number"
                required
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuel Type *</label>
              <select
                value={editFuelType}
                onChange={(e) => setEditFuelType(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classification *</label>
              <select
                value={editVehicleType}
                onChange={(e) => setEditVehicleType(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupe">Coupe</option>
                <option value="Convertible">Convertible</option>
                <option value="Minivan">Minivan</option>
                <option value="Pickup Truck">Pickup Truck</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Odometer Modal */}
      <Modal isOpen={isOdoModalOpen} onClose={() => setIsOdoModalOpen(false)} title="Update Odometer Reading">
        <form onSubmit={handleUpdateOdometer} className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 leading-normal">
              Enter the current odometer value. Doing so resets standard calculations for time/mileage diagnostics.
            </p>
            <div className="flex items-center gap-3 py-2">
              <span className="text-xs text-slate-500">Current reading:</span>
              <span className="text-sm font-bold text-slate-300">{formatOdometer(vehicle?.currentOdometer)}</span>
            </div>
            <input
              type="number"
              required
              value={newOdo}
              onChange={(e) => setNewOdo(e.target.value)}
              placeholder="e.g. 46500"
              className="w-full px-4 py-3 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsOdoModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Service Record Modal */}
      <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title="Log Repair / Maintenance Record">
        <form onSubmit={handleAddServiceRecord} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="e.g. Engine oil replaced with Mobil 1, oil filter swapped"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parts Replaced (comma separated)</label>
              <input
                type="text"
                value={serviceParts}
                onChange={(e) => setServiceParts(e.target.value)}
                placeholder="e.g. Engine Oil, Oil Filter, Spark Plug"
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
                placeholder="e.g. Pep Boys #104"
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
              onClick={() => setIsServiceModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Vehicle Deletion">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm leading-relaxed">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <span>
              <strong>Warning:</strong> Deleting this vehicle will permanently clear all its historical repair records, scheduled appointments, and calculations logs. This action is irreversible.
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Are you sure you want to delete <strong>{vehicle?.manufacturer} {vehicle?.model} ({vehicle?.registrationNumber})</strong>?
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              No, Keep Vehicle
            </button>
            <button
              type="button"
              onClick={handleDeleteVehicle}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Deleting...' : 'Yes, Delete Vehicle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast banner */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default VehicleDetail;
