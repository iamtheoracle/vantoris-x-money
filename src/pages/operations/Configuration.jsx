import React, { useState, useEffect } from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { base44 } from '@/api/base44Client';
import { Settings, FolderOpen, Code, Bell, Shield, Database, HardDrive, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

const tabs = [
  { id: 'storage', label: 'Document Storage', icon: FolderOpen },
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data Management', icon: Database },
];

function Toggle({ enabled, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-all ${enabled ? 'bg-brass' : 'bg-[#242D38]'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function StorageConfig() {
  const [enabled, setEnabled] = useState(false);
  const [archivalEnabled, setArchivalEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  function handleTest() {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(enabled ? 'success' : 'failed');
    }, 1500);
  }

  return (
    <div className="space-y-6">
      <div className="vantoris-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center">
              <HardDrive size={20} className="text-brass" />
            </div>
            <div>
              <p className="text-white font-medium">Document Storage</p>
              <p className="text-[#AAB4C3] text-xs">Configure external document archival and storage</p>
            </div>
          </div>
          <Toggle enabled={enabled} onClick={() => setEnabled(!enabled)} />
        </div>
        <div className={`transition-all ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Provider</label>
              <select className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none">
                <option>Google Drive</option>
              </select>
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Shared Folder ID</label>
              <input className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" placeholder="Drive folder ID" />
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Folder Structure</label>
              <input className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" placeholder="/members/{user_id}/statements/" defaultValue="/members/{user_id}/statements/" />
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Retention Policy</label>
              <select className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none">
                <option>7 Years</option>
                <option>10 Years</option>
                <option>Indefinite</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between p-4 bg-[#1a2535] rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Archive Statements Automatically</p>
              <p className="text-[#AAB4C3] text-xs">Save generated statements to external storage</p>
            </div>
            <Toggle enabled={archivalEnabled} onClick={() => setArchivalEnabled(!archivalEnabled)} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleTest} disabled={testing} className="px-4 py-2 bg-brass/15 text-brass rounded-xl text-xs font-medium hover:bg-brass/25 transition-all disabled:opacity-40">
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult === 'success' && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <CheckCircle2 size={14} /> Connection successful
              </span>
            )}
            {testResult === 'failed' && (
              <span className="flex items-center gap-1.5 text-red-400 text-xs">
                <XCircle size={14} /> Authentication required
              </span>
            )}
          </div>
          <div className="mt-4 p-4 bg-[#1a2535] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[#AAB4C3] text-xs">Health Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#242D38] text-[#AAB4C3]'}`}>
                {enabled ? 'Operational' : 'Disabled'}
              </span>
            </div>
          </div>
          <p className="text-[#AAB4C3] text-xs mt-4">
            Additional storage providers (AWS S3, Azure Blob, Dropbox) can be added without changing business logic.
          </p>
        </div>
      </div>
    </div>
  );
}

function GeneralConfig() {
  return (
    <div className="vantoris-card p-12 text-center">
      <Settings size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
      <p className="text-white font-medium mb-1">General Configuration</p>
      <p className="text-[#AAB4C3] text-sm">Platform-wide settings will be configured here.</p>
    </div>
  );
}

export default function Configuration() {
  const [activeTab, setActiveTab] = useState('storage');

  return (
    <OperationsPageLayout title="Configuration Center" description="Platform configuration and system settings" icon={Settings}>
      <div className="flex gap-2 mb-6 border-b border-[#242D38] pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'text-brass border-b-2 border-brass' : 'text-[#AAB4C3] hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === 'storage' && <StorageConfig />}
      {activeTab === 'general' && <GeneralConfig />}
      {activeTab === 'notifications' && (
        <div className="vantoris-card p-12 text-center">
          <Bell size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
          <p className="text-white font-medium mb-1">Notification Configuration</p>
          <p className="text-[#AAB4C3] text-sm">Configure notification channels and templates.</p>
        </div>
      )}
      {activeTab === 'security' && (
        <div className="vantoris-card p-12 text-center">
          <Shield size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
          <p className="text-white font-medium mb-1">Security Configuration</p>
          <p className="text-[#AAB4C3] text-sm">Security policies and access controls will be configured here.</p>
        </div>
      )}
      {activeTab === 'data' && (
        <div className="vantoris-card p-12 text-center">
          <Database size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
          <p className="text-white font-medium mb-1">Data Management</p>
          <p className="text-[#AAB4C3] text-sm">Data retention, backups, and migration tools.</p>
        </div>
      )}
    </OperationsPageLayout>
  );
}