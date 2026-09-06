/**
 * Supabase Multi-User Accounts & Database Integration Client
 * Provides Supabase Auth (Sign Up, Sign In, Sign Out), session persistence,
 * and user-scoped IoT device isolation.
 *
 * Rules:
 * 1. Primary Owner ("Wilkie"): Preloaded with Spark Core running and full preset sensors.
 * 2. Other Users / Developers: Start with a blank workspace ([]) until they add their hardware,
 *    IP details, or serial numbers.
 * 3. Syncs devices with Supabase 'devices' and 'profiles' tables with Row Level Security (RLS).
 * 4. Graceful offline/local mode when Supabase credentials are not yet entered.
 *
 * Part of SMART IOT HUB • Built by TekStep Apps Uganda (tekstepapps.org)
 */

import { createClient } from '@supabase/supabase-js';

// Local storage keys
const STORAGE_CONFIG_URL = 'sr_supabase_url_v1';
const STORAGE_CONFIG_KEY = 'sr_supabase_anon_key_v1';
const STORAGE_ACTIVE_USER = 'sr_supabase_active_user_v1';
const STORAGE_SAVED_ACCOUNTS = 'sr_local_registered_accounts_v1';

// Primary Owner Account Definition
export const WILKIE_PRIMARY_USER = {
  id: 'user_wilkie_master',
  email: 'wilk@tekstepapps.org',
  fullName: 'Wilkie (Master Owner)',
  isPrimaryOwner: true,
  createdAt: '2024-01-01T00:00:00.000Z'
};

// SQL Schema for user to run in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- =========================================================================
-- SmartRoom IoT Sentinel — Supabase Database Setup & RLS Security
-- Run this in your Supabase Project -> SQL Editor
-- =========================================================================

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  is_primary_owner boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. IoT Devices Table (Scoped per user)
create table if not exists public.devices (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null,
  board_profile_id text,
  connection_method text not null,
  status text default 'online',
  credentials jsonb default '{}'::jsonb,
  attached_sensors jsonb default '[]'::jsonb,
  sensor_schema jsonb default '[]'::jsonb,
  zone text default 'Primary Zone',
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for devices
alter table public.devices enable row level security;
create policy "Users can view own devices" on public.devices for select using (auth.uid() = user_id);
create policy "Users can insert own devices" on public.devices for insert with check (auth.uid() = user_id);
create policy "Users can update own devices" on public.devices for update using (auth.uid() = user_id);
create policy "Users can delete own devices" on public.devices for delete using (auth.uid() = user_id);
`;

class SupabaseService {
  constructor() {
    this.url = this._load(STORAGE_CONFIG_URL, '');
    this.anonKey = this._load(STORAGE_CONFIG_KEY, '');
    this.currentUser = this._loadActiveUser();
    this.supabase = null;
    this.listeners = new Set();

    this._initClient();
  }

  _load(key, fallback = '') {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        return val ? val : fallback;
      }
    } catch (_) {}
    return fallback;
  }

  _save(key, val) {
    try {
      if (typeof localStorage !== 'undefined') {
        if (val === null || val === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        }
      }
    } catch (_) {}
  }

  _loadActiveUser() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_ACTIVE_USER);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (_) {}
    // Default to Wilkie (Master Owner with Spark Core preloaded)
    return { ...WILKIE_PRIMARY_USER };
  }

  _initClient() {
    if (this.url && this.anonKey) {
      try {
        this.supabase = createClient(this.url, this.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
      } catch (err) {
        console.warn('[Supabase] Init error:', err.message);
        this.supabase = null;
      }
    } else {
      this.supabase = null;
    }
  }

  isConfigured() {
    return Boolean(this.supabase && this.url && this.anonKey);
  }

  getConfig() {
    return {
      url: this.url,
      anonKey: this.anonKey,
      isConfigured: this.isConfigured()
    };
  }

  setConfig(url, anonKey) {
    this.url = (url || '').trim();
    this.anonKey = (anonKey || '').trim();
    this._save(STORAGE_CONFIG_URL, this.url);
    this._save(STORAGE_CONFIG_KEY, this.anonKey);
    this._initClient();
    this.notifyAuthChange();
    return this.isConfigured();
  }

  getCurrentUser() {
    return this.currentUser || { ...WILKIE_PRIMARY_USER };
  }

  isCurrentUserOwner() {
    const user = this.getCurrentUser();
    return Boolean(user && (user.isPrimaryOwner || user.id === 'user_wilkie_master' || (user.email && user.email.toLowerCase().includes('wilk'))));
  }

  onAuthChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notifyAuthChange() {
    const user = this.getCurrentUser();
    this.listeners.forEach(fn => {
      try { fn(user, this.isConfigured()); } catch (e) { console.error(e); }
    });
  }

  /**
   * Quick switch to Wilkie's master account (with Spark Core running).
   */
  switchToWilkie() {
    this.currentUser = { ...WILKIE_PRIMARY_USER };
    this._save(STORAGE_ACTIVE_USER, this.currentUser);
    this.notifyAuthChange();
    return this.currentUser;
  }

  /**
   * Quick switch to a demo guest / other user account (clean blank workspace).
   */
  switchToGuestUser(name = 'New Developer', email = 'developer@iot.local') {
    const guestUser = {
      id: 'user_guest_' + Math.floor(100000 + Math.random() * 900000),
      email,
      fullName: name,
      isPrimaryOwner: false,
      createdAt: new Date().toISOString()
    };
    this.currentUser = guestUser;
    this._save(STORAGE_ACTIVE_USER, this.currentUser);
    this.notifyAuthChange();
    return this.currentUser;
  }

  /**
   * Sign In with Supabase Auth (or offline local accounts fallback)
   */
  async signIn({ email, password }) {
    email = (email || '').trim().toLowerCase();
    
    // Check if this is Wilkie's primary email
    if (email.includes('wilk')) {
      return { user: this.switchToWilkie(), error: null };
    }

    if (this.isConfigured()) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        const isOwner = email.includes('wilk');
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || email.split('@')[0],
          isPrimaryOwner: isOwner,
          createdAt: data.user.created_at
        };
        this.currentUser = userObj;
        this._save(STORAGE_ACTIVE_USER, this.currentUser);
        this.notifyAuthChange();
        return { user: userObj, error: null };
      } catch (err) {
        return { user: null, error: err.message };
      }
    } else {
      // Local offline account mode
      const savedAccounts = this._loadSavedAccounts();
      const existing = savedAccounts.find(a => a.email.toLowerCase() === email);
      if (existing) {
        if (existing.password !== password) {
          return { user: null, error: 'Incorrect password for local account.' };
        }
        this.currentUser = {
          id: existing.id,
          email: existing.email,
          fullName: existing.fullName,
          isPrimaryOwner: false,
          createdAt: existing.createdAt
        };
        this._save(STORAGE_ACTIVE_USER, this.currentUser);
        this.notifyAuthChange();
        return { user: this.currentUser, error: null };
      } else {
        return { user: null, error: 'Account not found. Please Sign Up first.' };
      }
    }
  }

  /**
   * Sign Up with Supabase Auth (or offline local accounts fallback)
   * Other users created here start with a completely blank workspace!
   */
  async signUp({ email, password, fullName }) {
    email = (email || '').trim().toLowerCase();
    fullName = (fullName || email.split('@')[0]).trim();

    const isOwner = email.includes('wilk');

    if (this.isConfigured()) {
      try {
        const { data, error } = await this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, is_primary_owner: isOwner }
          }
        });
        if (error) throw error;

        const userId = data.user?.id || ('user_' + Date.now());
        const userObj = {
          id: userId,
          email,
          fullName,
          isPrimaryOwner: isOwner,
          createdAt: new Date().toISOString()
        };

        // If user profile table exists, try upserting profile
        try {
          await this.supabase.from('profiles').upsert({
            id: userId,
            email,
            full_name: fullName,
            is_primary_owner: isOwner
          });
        } catch (_) {}

        this.currentUser = userObj;
        this._save(STORAGE_ACTIVE_USER, this.currentUser);
        this.notifyAuthChange();
        return { user: userObj, error: null };
      } catch (err) {
        return { user: null, error: err.message };
      }
    } else {
      // Local offline registration
      const savedAccounts = this._loadSavedAccounts();
      if (savedAccounts.some(a => a.email.toLowerCase() === email)) {
        return { user: null, error: 'An account with this email already exists locally.' };
      }

      const newAccount = {
        id: 'user_local_' + Math.floor(100000 + Math.random() * 900000),
        email,
        password,
        fullName,
        isPrimaryOwner: isOwner,
        createdAt: new Date().toISOString()
      };
      savedAccounts.push(newAccount);
      this._save(STORAGE_SAVED_ACCOUNTS, savedAccounts);

      this.currentUser = {
        id: newAccount.id,
        email: newAccount.email,
        fullName: newAccount.fullName,
        isPrimaryOwner: newAccount.isPrimaryOwner,
        createdAt: newAccount.createdAt
      };
      this._save(STORAGE_ACTIVE_USER, this.currentUser);
      this.notifyAuthChange();
      return { user: this.currentUser, error: null };
    }
  }

  /**
   * Sign Out — defaults back to Wilkie or Guest
   */
  async signOut() {
    if (this.isConfigured()) {
      try {
        await this.supabase.auth.signOut();
      } catch (_) {}
    }
    // Return to Wilkie's master account
    this.switchToWilkie();
    return true;
  }

  _loadSavedAccounts() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_SAVED_ACCOUNTS);
        if (raw) return JSON.parse(raw);
      }
    } catch (_) {}
    return [];
  }

  /**
   * Fetch devices from Supabase Database for the current user
   */
  async fetchCloudDevices(userId) {
    if (!this.isConfigured() || !this.supabase) return null;
    try {
      const { data, error } = await this.supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      
      return data.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        boardProfileId: d.board_profile_id,
        connectionMethod: d.connection_method,
        status: d.status || 'online',
        credentials: d.credentials || {},
        attachedSensors: d.attached_sensors || [],
        sensorSchema: d.sensor_schema || [],
        zone: d.zone || 'Primary Zone',
        lastSeen: d.last_seen || new Date().toISOString()
      }));
    } catch (err) {
      console.warn('[Supabase DB] Failed to fetch devices:', err.message);
      return null;
    }
  }

  /**
   * Sync a device to Supabase Database for the current user
   */
  async syncDeviceToCloud(userId, device) {
    if (!this.isConfigured() || !this.supabase) return false;
    try {
      const { error } = await this.supabase.from('devices').upsert({
        id: device.id,
        user_id: userId,
        name: device.name,
        type: device.type,
        board_profile_id: device.boardProfileId || device.type,
        connection_method: device.connectionMethod,
        status: device.status || 'online',
        credentials: device.credentials || {},
        attached_sensors: device.attachedSensors || [],
        sensor_schema: device.sensorSchema || [],
        zone: device.zone || 'Primary Zone',
        last_seen: device.lastSeen || new Date().toISOString()
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Supabase DB] Failed to sync device:', err.message);
      return false;
    }
  }

  /**
   * Delete a device from Supabase Database
   */
  async deleteDeviceFromCloud(deviceId) {
    if (!this.isConfigured() || !this.supabase) return false;
    try {
      const { error } = await this.supabase.from('devices').delete().eq('id', deviceId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Supabase DB] Failed to delete device:', err.message);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();
