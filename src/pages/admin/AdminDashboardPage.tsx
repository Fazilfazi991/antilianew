import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, Home, PlusCircle, ClipboardList, Loader2, CheckCircle, Save, Trash2, UserCheck, MapPin, UserPlus } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { getTransactionType } from '@/lib/propertyTaxonomy';
import {
  fetchPendingCount,
  fetchAllUsers,
  setUserRole,
  fetchSiteSettings,
  upsertSiteSetting,
  fetchCities,
  addCity,
  deleteCity,
  createMarketingAccount,
  fetchPendingPortalUsers,
  approvePortalUser,
} from '@/lib/queries/admin';
import type { Profile, ProfileRole, City } from '@/lib/types';

const inputClass =
  'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300 text-sm';

export function AdminDashboardPage() {
  const { properties, loading } = useProperties();

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [newCityName, setNewCityName] = useState('');
  const [cityAdding, setCityAdding] = useState(false);
  const [cityDeleting, setCityDeleting] = useState<string | null>(null);

  const [mktName, setMktName] = useState('');
  const [mktEmail, setMktEmail] = useState('');
  const [mktPassword, setMktPassword] = useState('');
  const [mktCreating, setMktCreating] = useState(false);
  const [mktSuccess, setMktSuccess] = useState(false);
  const [mktError, setMktError] = useState('');

  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingCount().then(setPendingCount).catch(console.error);
    fetchAllUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setUsersLoading(false));
    fetchSiteSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setSettingsLoading(false));
    fetchCities().then(setCities).catch(console.error);
    fetchPendingPortalUsers().then(setPendingUsers).catch(console.error);
  }, []);

  const stats = useMemo(() => {
    const available = properties.filter(p => p.status === 'available').length;
    const rented = properties.filter(p => p.status === 'rented').length;
    const sold = properties.filter(p => p.status === 'sold').length;
    const rent = properties.filter(p => getTransactionType(p) === 'rent').length;
    const buy = properties.filter(p => getTransactionType(p) === 'buy').length;
    const commercial = properties.filter(p => p.category === 'commercial').length;
    return { total: properties.length, available, rented, sold, rent, buy, commercial };
  }, [properties]);

  async function handleRoleChange(userId: string, role: ProfileRole) {
    setRoleUpdating(userId);
    try {
      await setUserRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setRoleUpdating(null);
    }
  }

  async function handleSaveSettings() {
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      await Promise.all(
        Object.entries(settings).map(([key, value]) => upsertSiteSetting(key, value))
      );
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleAddCity() {
    const name = newCityName.trim();
    if (!name) return;
    setCityAdding(true);
    try {
      await addCity(name);
      const updated = await fetchCities();
      setCities(updated);
      setNewCityName('');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Add failed');
    } finally {
      setCityAdding(false);
    }
  }

  async function handleDeleteCity(id: string) {
    if (!window.confirm('Delete this city?')) return;
    setCityDeleting(id);
    try {
      await deleteCity(id);
      setCities(prev => prev.filter(c => c.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setCityDeleting(null);
    }
  }

  async function handleCreateMarketingAccount() {
    const email = mktEmail.trim().toLowerCase();
    const name = mktName.trim();
    if (!email || !mktPassword) return;
    setMktCreating(true);
    setMktError('');
    setMktSuccess(false);
    try {
      await createMarketingAccount(name, email, mktPassword);
      setMktSuccess(true);
      setMktName('');
      setMktEmail('');
      setMktPassword('');
      // Refresh user list so new account appears in the table
      fetchAllUsers().then(setUsers).catch(console.error);
      setTimeout(() => setMktSuccess(false), 4000);
    } catch (e: unknown) {
      setMktError(e instanceof Error ? e.message : 'Failed to create account');
    } finally {
      setMktCreating(false);
    }
  }

  async function handleApproveUser(userId: string) {
    setApprovingUser(userId);
    try {
      await approvePortalUser(userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setApprovingUser(null);
    }
  }

  const agents = users.filter(u => u.role === 'agent');
  const marketingUsers = users.filter(u => u.role === 'marketing');
  const portalUsers = users.filter(u => u.role === 'user');

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            Overview
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
        </div>
        <Link
          to="/admin/properties/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
        >
          <PlusCircle className="size-4" />
          Add Property
        </Link>
      </div>

      {/* Approval queue alert */}
      {pendingCount > 0 && (
        <Link
          to="/admin/listings"
          className="flex items-center justify-between p-5 border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-label-caps text-label-caps text-amber-700 uppercase tracking-[0.1em]">
                {pendingCount} Listing{pendingCount !== 1 ? 's' : ''} Awaiting Approval
              </p>
              <p className="font-body-md text-body-md text-amber-600 text-sm mt-0.5">
                Review, edit contact details, and approve or reject submissions.
              </p>
            </div>
          </div>
          <span className="font-label-caps text-label-caps text-amber-700 uppercase tracking-[0.08em] group-hover:underline">
            Review →
          </span>
        </Link>
      )}

      {/* Property stats */}
      <div>
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-4">Properties</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-surface-variant mb-4">
          {[
            { label: 'Total Live', value: stats.total, icon: Building2 },
            { label: 'Available',  value: stats.available, icon: Home },
            { label: 'Rented',     value: stats.rented, icon: TrendingUp },
            { label: 'Sold',       value: stats.sold, icon: TrendingUp },
          ].map(card => (
            <div key={card.label} className="bg-background p-6">
              <card.icon className="size-4 text-outline mb-4" />
              <p className={`font-headline-lg text-headline-lg text-primary mb-1 ${loading ? 'opacity-20' : ''}`}>
                {loading ? '—' : card.value}
              </p>
              <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em]">
                {card.label}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-surface-variant">
          {[
            { label: 'For Rent', value: stats.rent },
            { label: 'For Sale', value: stats.buy },
            { label: 'Commercial', value: stats.commercial },
          ].map(cat => (
            <div key={cat.label} className="bg-surface-container-low px-6 py-4">
              <p className={`font-headline-md text-headline-md text-primary mb-1 ${loading ? 'opacity-20' : ''}`}>
                {loading ? '—' : cat.value}
              </p>
              <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em]">{cat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User management */}
      <div className="border border-surface-variant p-8">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-6">
          User Management
        </p>
        {usersLoading ? (
          <Loader2 className="size-4 text-outline animate-spin" />
        ) : (
          <div className="space-y-6">
            {/* Summary row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-surface-variant">
              {[
                { label: 'Agents', value: agents.length },
                { label: 'Marketing', value: marketingUsers.length },
                { label: 'Portal Users', value: portalUsers.length },
              ].map(r => (
                <div key={r.label} className="bg-background px-5 py-4">
                  <p className="font-headline-md text-headline-md text-primary mb-0.5">{r.value}</p>
                  <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em]">{r.label}</p>
                </div>
              ))}
            </div>

            {/* User list table */}
            {users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border border-surface-variant">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-surface-variant">
                      <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] text-left px-4 py-2.5">Name</th>
                      <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] text-left px-4 py-2.5 hidden md:table-cell">Position</th>
                      <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] text-left px-4 py-2.5">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-surface-variant last:border-0 hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-body-md text-body-md text-primary">{u.full_name || '—'}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em] text-xs">{u.position || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value as ProfileRole)}
                              disabled={roleUpdating === u.id}
                              className="bg-background border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none px-2 py-1 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.06em] text-xs appearance-none cursor-pointer disabled:opacity-50"
                            >
                              <option value="user">Portal User</option>
                              <option value="agent">Agent</option>
                              <option value="marketing">Marketing</option>
                            </select>
                            {roleUpdating === u.id && <Loader2 className="size-3 text-outline animate-spin" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Site contact settings */}
      <div className="border border-surface-variant p-8">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          Contact Settings
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 text-sm">
          These values are used as fallback contact details site-wide when no property-level overrides are set.
        </p>
        {settingsLoading ? (
          <Loader2 className="size-4 text-outline animate-spin" />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '97412345678' },
                { key: 'company_phone',   label: 'Company Phone',   placeholder: '+974 4xxx xxxx' },
                { key: 'company_email',   label: 'Company Email',   placeholder: 'info@antilia.qa' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-2 text-xs">
                    {label}
                  </label>
                  <input
                    className={inputClass}
                    value={settings[key] ?? ''}
                    onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                {settingsSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {settingsSaving ? 'Saving…' : 'Save Settings'}
              </button>
              {settingsSaved && (
                <span className="flex items-center gap-2 font-label-caps text-label-caps text-emerald-600 uppercase tracking-[0.08em]">
                  <CheckCircle className="size-4" />
                  Saved
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pending portal users */}
      {pendingUsers.length > 0 && (
        <div className="border border-surface-variant p-8">
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            Pending Portal Access
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6 text-sm">
            These users have signed up but need your approval before they can use the listing portal.
          </p>
          <div className="space-y-2">
            {pendingUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 border border-surface-variant hover:bg-surface-container-low transition-colors">
                <div>
                  <p className="font-body-md text-body-md text-primary">{u.full_name || '—'}</p>
                </div>
                <button
                  onClick={() => handleApproveUser(u.id)}
                  disabled={approvingUser === u.id}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.08em] hover:bg-secondary disabled:opacity-50 transition-colors"
                >
                  {approvingUser === u.id ? <Loader2 className="size-3 animate-spin" /> : <UserCheck className="size-3" />}
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create marketing account */}
      <div className="border border-surface-variant p-8">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          Create Marketing Account
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 text-sm">
          Create a login for in-house or agency marketing staff. Share the credentials directly — they log in at <strong>/marketing/login</strong>. No portal signup needed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          {[
            { label: 'Full Name', value: mktName, setter: setMktName, type: 'text', placeholder: 'e.g. Sara Ahmed' },
            { label: 'Email *', value: mktEmail, setter: setMktEmail, type: 'email', placeholder: 'sara@agency.com' },
            { label: 'Password *', value: mktPassword, setter: setMktPassword, type: 'password', placeholder: 'Min. 8 characters' },
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label}>
              <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-2 text-xs">{label}</label>
              <input
                className={inputClass}
                type={type}
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        {mktError && (
          <p className="font-body-md text-body-md text-error mb-4 text-sm">{mktError}</p>
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={handleCreateMarketingAccount}
            disabled={mktCreating || !mktEmail.trim() || !mktPassword.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            {mktCreating ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
            {mktCreating ? 'Creating…' : 'Create Account'}
          </button>
          {mktSuccess && (
            <span className="flex items-center gap-2 font-label-caps text-label-caps text-emerald-600 uppercase tracking-[0.08em]">
              <CheckCircle className="size-4" />
              Account created
            </span>
          )}
        </div>
        {users.filter(u => u.role === 'marketing').length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] text-xs mb-3">Existing Marketing Accounts</p>
            {users.filter(u => u.role === 'marketing').map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border border-surface-variant bg-surface-container-low">
                <p className="font-body-md text-body-md text-primary flex-1">{u.full_name || '—'}</p>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em] text-xs">{u.position || 'Marketing'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cities management */}
      <div className="border border-surface-variant p-8">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          City Management
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 text-sm">
          These cities appear in all property listing forms. Add new cities or delete incorrect entries.
        </p>
        <div className="flex gap-3 mb-5">
          <input
            className={inputClass + ' flex-1'}
            value={newCityName}
            onChange={e => setNewCityName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCity(); } }}
            placeholder="e.g. Al Khor"
          />
          <button
            onClick={handleAddCity}
            disabled={cityAdding || !newCityName.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.08em] hover:bg-secondary disabled:opacity-50 transition-colors shrink-0"
          >
            {cityAdding ? <Loader2 className="size-3 animate-spin" /> : <MapPin className="size-3" />}
            Add City
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {cities.map(city => (
            <div key={city.id} className="flex items-center gap-2 px-3 py-1.5 border border-surface-variant bg-background">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.06em]">{city.name}</span>
              <button
                onClick={() => handleDeleteCity(city.id)}
                disabled={cityDeleting === city.id}
                className="text-outline hover:text-error transition-colors disabled:opacity-30 ml-1"
                title="Delete city"
              >
                {cityDeleting === city.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="border border-surface-variant p-8">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-5">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Pending Listings', to: '/admin/listings' },
            { label: 'Manage Properties', to: '/admin/properties' },
            { label: 'Add New Property', to: '/admin/properties/new' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="font-label-caps text-label-caps text-on-surface-variant border border-surface-variant px-5 py-2.5 uppercase tracking-[0.08em] hover:border-primary hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/properties"
            target="_blank"
            className="font-label-caps text-label-caps text-on-surface-variant border border-surface-variant px-5 py-2.5 uppercase tracking-[0.08em] hover:border-primary hover:text-primary transition-colors"
          >
            View Public Listings ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
