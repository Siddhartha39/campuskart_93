import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, push, onValue, remove, get, set, update } from 'firebase/database';
import { database } from '../../config/firebase';
import { 
  Users, 
  Calendar, 
  Plus, 
  Trash2,
  MapPin,
  User,
  Mail,
  Phone,
  Ticket,
  Search,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Package
} from 'lucide-react';
import { Event, User as UserType, PlacementCompany } from '../../types';
import CollegeSelect from '../common/CollegeSelect';

type UserWithId = UserType & { id: string };

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Marketplace items state
  const [marketItems, setMarketItems] = useState<any[]>([]);
  // Placement management state
  const [placements, setPlacements] = useState<PlacementCompany[]>([]);
  const [placementForm, setPlacementForm] = useState({
    companyName: '',
    description: '',
    jobDescription: '',
    eligibility: '',
    skills: '',
    salary: '',
    location: '',
    lastDate: '',
    imageLink: '',
    applyLink: '',
    isFeatured: false,
    isHiringOpen: true,
    type: 'Internship' as 'Internship' | 'Placement',
  });
  const [editingPlacement, setEditingPlacement] = useState<PlacementCompany | null>(null);
  // Whisper reports state
  const [reports, setReports] = useState<any[]>([]);
  // Colleges admin state
  const [cityInput, setCityInput] = useState('');
  const [collegeInput, setCollegeInput] = useState('');
  const [collegesIndex, setCollegesIndex] = useState<Record<string, { key: string; name: string }[]>>({});

  // Helper: resolve user display name by id
  const getUserName = (uid?: string) => {
    if (!uid) return 'Unknown User';
    const u = users.find((x) => (x as any).id === uid);
    return (u as any)?.name || (u as any)?.displayName || uid;
  };

  const getUserEmail = (uid?: string) => {
    if (!uid) return 'Unknown Email';
    const u = users.find((x) => (x as any).id === uid);
    return (u as any)?.email || 'Email not available';
  };

  // Support ticket resolution state
  const [ticketId, setTicketId] = useState('');
  const [ticketData, setTicketData] = useState<any>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState('');

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    city: '',
    college: '',
    organizer: '',
    image: '',
    registrationUrl: '',
    openToAllCollege: false,
  });

  useEffect(() => {
    // Load users
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData).map(key => ({
          ...usersData[key],
          id: key
        }));
        setUsers(usersList);
      }
    });

    // Load events
    const eventsRef = ref(database, 'events');
    onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const eventsData = snapshot.val();
        const eventsList = Object.keys(eventsData).map(key => ({
          ...eventsData[key],
          id: key
        }));
        setEvents(eventsList);
      }
    });

    // Load marketplace items
    const itemsRef = ref(database, 'items');
    onValue(itemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((it: any) => !!it.isActive);
        setMarketItems(list);
      } else {
        setMarketItems([]);
      }
    });

    // Load colleges index
    const collegesRef = ref(database, 'colleges');
    onValue(collegesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setCollegesIndex({});
        return;
      }
      const data = snapshot.val();
      const normalized: Record<string, { key: string; name: string }[]> = {};
      Object.keys(data).forEach((city: string) => {
        const cityObj = data[city] || {};
        const list = Object.keys(cityObj).map((k) => ({ key: k, name: cityObj[k]?.name || cityObj[k] }));
        normalized[city] = list;
      });
      setCollegesIndex(normalized);
    });

    // Load whisper reports
    const reportsRef = ref(database, 'whisperReports');
    onValue(reportsRef, (snapshot) => {
      const out: any[] = [];
      if (!snapshot.exists()) {
        setReports([]);
        return;
      }
      const data = snapshot.val();
      Object.keys(data).forEach((whisperId) => {
        const whisperReports = data[whisperId] || {};
        Object.keys(whisperReports).forEach((reportId) => {
          const r = whisperReports[reportId];
          out.push({ reportId, whisperId, ...r });
        });
      });
      // newest first
      out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setReports(out);
    });

    // Load placement companies
    const placementsRef = ref(database, 'placements');
    onValue(placementsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setPlacements([]);
        return;
      }
      const data = snapshot.val();
      const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setPlacements(list);
    });
  }, []);

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const eventData = {
        ...eventForm,
        createdAt: new Date().toISOString()
      };

      const eventsRef = ref(database, 'events');
      await push(eventsRef, eventData);

      // Reset form
      setEventForm({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        city: '',
        college: '',
        organizer: '',
        image: '',
        registrationUrl: '',
        openToAllCollege: false,
      });

      alert('Event posted successfully!');
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  const deleteMarketItem = async (item: any) => {
    if (!item?.id) return;
    try {
      await remove(ref(database, `items/${item.id}`));
      // Notify the seller
      if (item.sellerId) {
        const notifRef = ref(database, `notifications/${item.sellerId}`);
        await push(notifRef, {
          type: 'admin',
          itemId: item.id,
          text: `Your post "${item.productName || 'your item'}" has been deleted by admin due to violating rules.`,
          createdAt: Date.now(),
          read: false,
        });
      }
    } catch (err: any) {
      console.error('Error deleting marketplace post:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await remove(ref(database, `users/${userId}`));
      setUsers(prev => prev.filter(u => (u as any).id !== userId && (u as any).uid !== userId));
    } catch (err: any) {
      console.error('Error deleting user:', err);
    }
  };

  const notifyAllUsers = async (message: string, type = 'placement') => {
    const now = Date.now();
    await Promise.all(users.map((user) =>
      push(ref(database, `notifications/${user.id}`), {
        type,
        text: message,
        createdAt: now,
        read: false,
      })
    ));
  };

  const resetPlacementForm = () => {
    setEditingPlacement(null);
    setPlacementForm({
      companyName: '',
      description: '',
      jobDescription: '',
      eligibility: '',
      skills: '',
      salary: '',
      location: '',
      lastDate: '',
      imageLink: '',
      applyLink: '',
      isFeatured: false,
      isHiringOpen: true,
      type: 'Internship',
    });
  };

  const handlePlacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        companyName: placementForm.companyName,
        description: placementForm.description,
        jobDescription: placementForm.jobDescription,
        eligibility: placementForm.eligibility,
        skills: placementForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        salary: placementForm.salary,
        location: placementForm.location,
        lastDate: placementForm.lastDate,
        imageLink: placementForm.imageLink,
        applyLink: placementForm.applyLink,
        isFeatured: placementForm.isFeatured,
        isHiringOpen: placementForm.isHiringOpen,
        type: placementForm.type,
        createdAt: editingPlacement?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingPlacement) {
        await update(ref(database, `placements/${editingPlacement.id}`), payload);
        if (editingPlacement.isHiringOpen !== payload.isHiringOpen) {
          await notifyAllUsers(`Hiring status updated for ${payload.companyName}.`, 'placement');
        }
        alert('Placement updated successfully!');
      } else {
        const placementsRef = ref(database, 'placements');
        const newRef = push(placementsRef);
        await set(newRef, { id: newRef.key, ...payload });
        await notifyAllUsers(`New ${payload.type.toLowerCase()} posted: ${payload.companyName}.`, 'placement');
        alert('Placement added successfully!');
      }

      resetPlacementForm();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleEditPlacement = (placement: PlacementCompany) => {
    setEditingPlacement(placement);
    setPlacementForm({
      companyName: placement.companyName,
      description: placement.description,
      jobDescription: placement.jobDescription,
      eligibility: placement.eligibility,
      skills: placement.skills.join(', '),
      salary: placement.salary,
      location: placement.location,
      lastDate: placement.lastDate,
      imageLink: placement.bannerUrl || placement.logoUrl || '',
      applyLink: placement.applyLink || placement.website || '',
      isFeatured: placement.isFeatured,
      isHiringOpen: placement.isHiringOpen,
      type: placement.type,
    });
  };

  const handleDeletePlacement = async (placementId: string) => {
    try {
      await remove(ref(database, `placements/${placementId}`));
      setPlacements(prev => prev.filter(p => p.id !== placementId));
    } catch (err: any) {
      console.error('Error deleting placement:', err);
    }
  };

  const handleTogglePlacementStatus = async (placement: PlacementCompany, field: 'isFeatured' | 'isHiringOpen') => {
    try {
      const updatedValue = !placement[field];
      await update(ref(database, `placements/${placement.id}`), {
        [field]: updatedValue,
        updatedAt: new Date().toISOString(),
      });
      if (field === 'isHiringOpen') {
        await notifyAllUsers(`Hiring status changed for ${placement.companyName}.`, 'placement');
      }
    } catch (err: any) {
      alert('Error updating placement status: ' + err.message);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await remove(ref(database, `events/${eventId}`));
      setEvents(prev => prev.filter(ev => (ev as any).id !== eventId));
    } catch (err: any) {
      console.error('Error deleting event:', err);
    }
  };

  const searchTicket = async () => {
    if (!ticketId.trim()) {
      setTicketError('Please enter a ticket ID');
      return;
    }

    setTicketLoading(true);
    setTicketError('');
    setTicketData(null);

    try {
      const ticketsRef = ref(database, 'supportTickets');
      const snapshot = await get(ticketsRef);
      
      if (snapshot.exists()) {
        const allTickets = snapshot.val();
        let foundTicket = null;
        let foundUserId = null;

        for (const userId in allTickets) {
          const userTickets = allTickets[userId];
          for (const ticketKey in userTickets) {
            const ticket = userTickets[ticketKey];
            if (ticket.ticketId === ticketId.trim()) {
              foundTicket = { ...ticket, key: ticketKey };
              foundUserId = userId;
              break;
            }
          }
          if (foundTicket) break;
        }

        if (foundTicket) {
          const userRef = ref(database, `users/${foundUserId}`);
          const userSnapshot = await get(userRef);
          const userData = userSnapshot.exists() ? userSnapshot.val() : null;

          setTicketData({
            ...foundTicket,
            userId: foundUserId,
            userData: userData
          });
        } else {
          setTicketError('Ticket not found');
        }
      } else {
        setTicketError('No tickets found in database');
      }
    } catch (error: any) {
      setTicketError('Error searching ticket: ' + error.message);
    } finally {
      setTicketLoading(false);
    }
  };

  const resolveTicket = async (status: 'resolved' | 'rejected') => {
    if (!ticketData) return;

    try {
      const ticketRef = ref(database, `supportTickets/${ticketData.userId}/${ticketData.key}`);
      await update(ticketRef, {
        status: status,
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'admin'
      });

      setTicketData({ ...ticketData, status: status });
      alert(`Ticket ${status} successfully!`);
    } catch (error: any) {
      alert('Error updating ticket: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Control Panel</h1>
          <p className="text-gray-600">Manage users, events, and platform content</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="h-5 w-5 inline mr-2" />
                Events & Hackathons
              </button>
              <button
                onClick={() => setActiveTab('market')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'market'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="h-5 w-5 inline mr-2" />
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-5 w-5 inline mr-2" />
                Users Management
              </button>
              <button
                onClick={() => setActiveTab('colleges')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'colleges'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPin className="h-5 w-5 inline mr-2" />
                Colleges
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Ticket className="h-5 w-5 inline mr-2" />
                Support Tickets
              </button>
              <button
                onClick={() => setActiveTab('placements')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'placements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="h-5 w-5 inline mr-2" />
                Placements
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Search className="h-5 w-5 inline mr-2" />
                Reports
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'reports' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Reported Whispers</h2>
                {reports.length === 0 ? (
                  <div className="text-gray-600">No reports at the moment.</div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((r) => (
                      <div key={`${r.whisperId}-${r.reportId}`} className="p-4 border rounded-md bg-white">
                        <div className="flex flex-col gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Whisper ID: {r.whisperId}</div>
                            <div className="mt-2 text-slate-700">{r.reason}</div>
                            <div className="mt-2 text-xs text-gray-500">Reported by: {r.reporterName || getUserName(r.reporterUid)}</div>
                            <div className="mt-1 text-xs text-gray-500">Reporter email: {r.reporterEmail || getUserEmail(r.reporterUid)}</div>
                            <div className="mt-1 text-xs text-gray-500">Post author: {r.whisperAuthorUid ? getUserName(r.whisperAuthorUid) : 'Unknown'}</div>
                            <div className="mt-1 text-xs text-gray-500">Post author email: {r.whisperAuthorUid ? getUserEmail(r.whisperAuthorUid) : 'Unknown'}</div>
                            <div className="mt-1 text-xs text-gray-500">Reported at: {new Date(r.createdAt).toLocaleString()}</div>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 border border-slate-200">
                            <p className="font-semibold text-slate-900">Whisper detail</p>
                            <p className="mt-2 text-slate-600">Category: {r.whisperCategory}</p>
                            <p className="mt-1 text-slate-600">Message: {r.whisperMessage || 'No message available'}</p>
                            {r.whisperImages?.length ? (
                              <div className={`mt-3 grid gap-3 ${r.whisperImages.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                                {r.whisperImages.slice(0, 2).map((img: string, idx: number) => (
                                  <div key={idx} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <div className="h-72 w-full bg-slate-100">
                                      <img src={img} alt={`reported-whisper-${idx}`} className="h-full w-full object-contain" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-col gap-2">
                            <button onClick={async () => {
                              try {
                                await remove(ref(database, `whispers/${r.whisperId}`));
                                await remove(ref(database, `whisperReports/${r.whisperId}`));
                                setReports(prev => prev.filter(item => item.whisperId !== r.whisperId));
                              } catch (err: any) {
                                console.error('Error deleting whisper:', err);
                              }
                            }} className="px-3 py-2 bg-red-50 text-red-700 rounded">Delete Whisper</button>

                            <button onClick={async () => {
                              try {
                                await remove(ref(database, `whisperReports/${r.whisperId}/${r.reportId}`));
                                setReports(prev => prev.filter(item => !(item.whisperId === r.whisperId && item.reportId === r.reportId)));
                              } catch (err: any) {
                                console.error('Error dismissing report:', err);
                              }
                            }} className="px-3 py-2 bg-gray-100 text-gray-700 rounded">Dismiss Report</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'events' && (
              <div className="space-y-8">
                {/* Create Event Form */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Plus className="h-6 w-6 mr-2" />
                    Create New Event/Hackathon
                  </h2>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleEventSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event/Hackathon Title *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter event or hackathon title"
                          value={eventForm.title}
                          onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Organizer *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Event organizer"
                          value={eventForm.organizer}
                          onChange={(e) => setEventForm(prev => ({ ...prev, organizer: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date *
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={eventForm.date}
                          onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time *
                        </label>
                        <input
                          type="time"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={eventForm.time}
                          onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Venue *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Event venue"
                          value={eventForm.venue}
                          onChange={(e) => setEventForm(prev => ({ ...prev, venue: e.target.value }))}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <CollegeSelect
                          required={!eventForm.openToAllCollege}
                          value={{ city: (eventForm as any).city || '', college: eventForm.college }}
                          onChange={(val) => setEventForm(prev => ({ ...(prev as any), city: val.city, college: val.college }))}
                          comboMode
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-4 md:pt-0">
                        <input
                          id="openToAllCollege"
                          type="checkbox"
                          checked={eventForm.openToAllCollege}
                          onChange={(e) => setEventForm(prev => ({
                            ...prev,
                            openToAllCollege: e.target.checked,
                            ...(e.target.checked ? { city: '', college: '' } : {})
                          }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="openToAllCollege" className="text-sm text-gray-700">
                          Open to all colleges
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Image URL
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/image.jpg"
                          value={eventForm.image}
                          onChange={(e) => setEventForm(prev => ({ ...prev, image: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration URL *
                        </label>
                        <input
                          type="url"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/register"
                          value={eventForm.registrationUrl}
                          onChange={(e) => setEventForm(prev => ({ ...prev, registrationUrl: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Event description..."
                        value={eventForm.description}
                        onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? 'Creating Event/Hackathon...' : 'Create Event/Hackathon'}
                    </button>
                  </form>
                </div>

                {/* Events List */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">All Events & Hackathons ({events.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                      <div key={event.id} className="bg-white rounded-lg shadow-sm border p-4">
                        {event.image && (
                          <img src={event.image} alt={event.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                        )}
                        <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.venue}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {event.date} at {event.time}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{event.openToAllCollege ? 'Open to all colleges' : event.college || '—'}</span>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'placements' && (
              <div className="space-y-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Sparkles className="h-6 w-6 mr-2" />
                    Manage Placements & Internships
                  </h2>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handlePlacementSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={placementForm.companyName}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, companyName: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Type</label>
                        <select
                          value={placementForm.type}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, type: e.target.value as 'Internship' | 'Placement' }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Internship">Internship</option>
                          <option value="Placement">Placement</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={placementForm.location}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, location: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Salary / Stipend</label>
                        <input
                          type="text"
                          value={placementForm.salary}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, salary: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Date</label>
                        <input
                          type="date"
                          value={placementForm.lastDate}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, lastDate: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image Link</label>
                        <input
                          type="url"
                          value={placementForm.imageLink}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, imageLink: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apply Link</label>
                        <input
                          type="url"
                          value={placementForm.applyLink}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, applyLink: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Overview *</label>
                        <textarea
                          rows={3}
                          required
                          value={placementForm.description}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Description *</label>
                        <textarea
                          rows={3}
                          required
                          value={placementForm.jobDescription}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, jobDescription: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility *</label>
                        <textarea
                          rows={2}
                          required
                          value={placementForm.eligibility}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, eligibility: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                        <input
                          type="text"
                          value={placementForm.skills}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, skills: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={placementForm.isFeatured}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        Feature this opportunity
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={placementForm.isHiringOpen}
                          onChange={(e) => setPlacementForm((prev) => ({ ...prev, isHiringOpen: e.target.checked }))}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        Hiring open
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button
                        type="submit"
                        className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                      >
                        {editingPlacement ? 'Update Placement' : 'Create Placement'}
                      </button>
                      {editingPlacement && (
                        <button
                          type="button"
                          onClick={resetPlacementForm}
                          className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">All Opportunities ({placements.length})</h2>
                  {placements.length === 0 ? (
                    <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                      No placement opportunities added yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {placements.map((placement) => (
                        <div key={placement.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                <span className="rounded-full bg-slate-100 px-3 py-1">{placement.type}</span>
                                {placement.isFeatured && <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">Featured</span>}
                                {!placement.isHiringOpen && <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Closed</span>}
                              </div>
                              <h3 className="mt-2 text-lg font-semibold text-slate-900">{placement.companyName}</h3>
                              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{placement.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => handleEditPlacement(placement)}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePlacement(placement.id)}
                                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleTogglePlacementStatus(placement, 'isHiringOpen')}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {placement.isHiringOpen ? 'Close Hiring' : 'Open Hiring'}
                              </button>
                              <button
                                onClick={() => handleTogglePlacementStatus(placement, 'isFeatured')}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {placement.isFeatured ? 'Unfeature' : 'Feature'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'market' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">All Buy Posts ({marketItems.length})</h2>
                {marketItems.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg border">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No marketplace posts found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketItems.map((it) => (
                      <div key={it.id} className="bg-white rounded-lg shadow-sm border p-4">
                        {it.productImage && (
                          <img src={it.productImage} alt={it.productName} className="w-full h-32 object-cover rounded-lg mb-3" />
                        )}
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{it.productName || 'Untitled'}</h3>
                        <div className="text-xs text-gray-600 mb-2">
                          Posted by{' '}
                          {it.sellerId ? (
                            <Link to={`/profile/${it.sellerId}`} className="text-blue-600 hover:underline">
                              {getUserName(it.sellerId)}
                            </Link>
                          ) : (
                            <span>Unknown</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-2 line-clamp-2">{it.type}</div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                          <span className="font-medium text-blue-600">₹{(it.price||0).toLocaleString()}</span>
                          <span className="text-gray-500">{it.sellerCollege || '—'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">{it.createdAt ? new Date(it.createdAt).toLocaleString() : ''}</div>
                        <div className="flex justify-end">
                          <button onClick={() => deleteMarketItem(it)} className="text-red-600 hover:text-red-800 p-1" title="Delete post">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">All Users ({users.length})</h2>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            College
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id || user.uid || user.email} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium">
                                    {user.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.college}</div>
                              <div className="text-sm text-gray-500">{user.city}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.mobile}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => deleteUser(user.id || user.uid)}
                                className="text-red-600 hover:text-red-900 ml-4"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'colleges' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Plus className="h-5 w-5 mr-2" /> Add College
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter city name"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">College *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter college name"
                        value={collegeInput}
                        onChange={(e) => setCollegeInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    onClick={async () => {
                      if (!cityInput.trim() || !collegeInput.trim()) return alert('City and College are required');
                      const city = cityInput.trim();
                      const name = collegeInput.trim();
                      await push(ref(database, `colleges/${city}`), { name });
                      setCollegeInput('');
                    }}
                  >
                    Add
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">All Colleges</h2>
                  {Object.keys(collegesIndex).length === 0 ? (
                    <p className="text-gray-500">No colleges added yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {Object.keys(collegesIndex).sort().map((city) => (
                        <div key={city} className="bg-white rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{city}</h3>
                          </div>
                          <ul className="divide-y">
                            {collegesIndex[city].map((c) => (
                              <li key={c.key} className="py-2 flex items-center justify-between">
                                <span>{c.name}</span>
                                <button
                                  className="text-red-600 hover:text-red-800"
                                  onClick={async () => {
                                    if (!confirm('Delete this college?')) return;
                                    await remove(ref(database, `colleges/${city}/${c.key}`));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-8">
                {/* Ticket Search */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Search className="h-6 w-6 mr-2" />
                    Search Support Ticket
                  </h2>
                  
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        placeholder="Enter 6-digit ticket ID (e.g., 123456)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={searchTicket}
                      disabled={ticketLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {ticketLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Search
                    </button>
                  </div>

                  {ticketError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                      {ticketError}
                    </div>
                  )}
                </div>

                {/* Ticket Details */}
                {ticketData && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        Ticket #{ticketData.ticketId}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        ticketData.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        ticketData.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        ticketData.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticketData.status.charAt(0).toUpperCase() + ticketData.status.slice(1)}
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          User Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Name:</span>
                            <span className="text-gray-600">{ticketData.userData?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="text-gray-600">{ticketData.userData?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-700">Mobile:</span>
                            <span className="text-gray-600">{ticketData.userData?.mobile || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-700">College:</span>
                            <span className="text-gray-600">{ticketData.userData?.college || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Ticket Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <span className="text-gray-600 ml-2">
                              {new Date(ticketData.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Purpose:</span>
                            <span className="text-gray-600 ml-2">{ticketData.purpose}</span>
                          </div>
                          {ticketData.resolvedAt && (
                            <div>
                              <span className="font-medium text-gray-700">Resolved:</span>
                              <span className="text-gray-600 ml-2">
                                {new Date(ticketData.resolvedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{ticketData.description}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {ticketData.status === 'open' && (
                      <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => resolveTicket('resolved')}
                          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Resolved
                        </button>
                        <button
                          onClick={() => resolveTicket('rejected')}
                          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          <XCircle className="h-4 w-4" />
                          Mark as Rejected
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};