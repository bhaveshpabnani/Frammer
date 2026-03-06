import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Globe,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Zap,
  Link2,
  Server,
  Cloud,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ConnectorStatus = 'idle' | 'connecting' | 'tables' | 'connected' | 'error';

interface ConnectorConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: { key: string; label: string; type: 'text' | 'password' | 'number'; placeholder: string }[];
  badge?: string;
}

interface ActiveConnection {
  connectorId: string;
  name: string;
  tables: string[];
  status: 'active' | 'error';
  lastSync: string;
}

const CONNECTORS: ConnectorConfig[] = [
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Connect to any PostgreSQL database',
    icon: <Database size={22} />,
    color: '#336791',
    fields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', placeholder: '5432' },
      { key: 'database', label: 'Database', type: 'text', placeholder: 'mydb' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'postgres' },
      { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    ],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Connect to MySQL or MariaDB databases',
    icon: <Server size={22} />,
    color: '#00758F',
    fields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', placeholder: '3306' },
      { key: 'database', label: 'Database', type: 'text', placeholder: 'mydb' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'root' },
      { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    ],
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Cloud data warehouse analytics',
    icon: <Cloud size={22} />,
    color: '#29B5E8',
    badge: 'Cloud',
    fields: [
      { key: 'account', label: 'Account ID', type: 'text', placeholder: 'xy12345.us-east-1' },
      { key: 'warehouse', label: 'Warehouse', type: 'text', placeholder: 'COMPUTE_WH' },
      { key: 'database', label: 'Database', type: 'text', placeholder: 'ANALYTICS' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'my_user' },
      { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    ],
  },
  {
    id: 'bigquery',
    name: 'BigQuery',
    description: 'Google Cloud serverless data warehouse',
    icon: <Zap size={22} />,
    color: '#4285F4',
    badge: 'Cloud',
    fields: [
      { key: 'project_id', label: 'Project ID', type: 'text', placeholder: 'my-gcp-project' },
      { key: 'dataset', label: 'Dataset', type: 'text', placeholder: 'analytics_dataset' },
      { key: 'credentials_json', label: 'Service Account Key (JSON)', type: 'text', placeholder: 'Paste JSON key...' },
    ],
  },
  {
    id: 'csv_upload',
    name: 'CSV Upload',
    description: 'Upload CSV or Excel files directly',
    icon: <Upload size={22} />,
    color: '#22C55E',
    fields: [],
  },
  {
    id: 'api_endpoint',
    name: 'REST API',
    description: 'Connect to any JSON REST API endpoint',
    icon: <Globe size={22} />,
    color: '#F59E0B',
    fields: [
      { key: 'url', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.example.com/data' },
      { key: 'auth_header', label: 'Authorization Header', type: 'text', placeholder: 'Bearer YOUR_TOKEN' },
      { key: 'refresh_interval', label: 'Refresh every (minutes)', type: 'number', placeholder: '60' },
    ],
  },
];

const MOCK_ACTIVE: ActiveConnection[] = [
  {
    connectorId: 'postgres',
    name: 'Production Supabase',
    tables: ['fact_video_usage', 'dim_channels', 'dim_users'],
    status: 'active',
    lastSync: '2 min ago',
  },
  {
    connectorId: 'api_endpoint',
    name: 'Frammer Events API',
    tables: ['events_stream'],
    status: 'active',
    lastSync: '5 min ago',
  },
];

const MOCK_TABLES = [
  'fact_video_usage',
  'dim_channels',
  'dim_users',
  'dim_clients',
  'dim_language',
  'stg_raw_uploads',
  'stg_processing_log',
];

export default function ConnectorsPage() {
  const [selected, setSelected] = useState<ConnectorConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [connStatus, setConnStatus] = useState<ConnectorStatus>('idle');
  const [detectedTables, setDetectedTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [activeConnections, setActiveConnections] = useState<ActiveConnection[]>(MOCK_ACTIVE);
  const { toast } = useToast();

  const handleConnect = () => {
    setConnStatus('connecting');
    setTimeout(() => {
      setConnStatus('tables');
      setDetectedTables(MOCK_TABLES.slice(0, Math.floor(Math.random() * 3) + 3));
    }, 1800);
  };

  const handleIngest = () => {
    setConnStatus('connecting');
    setTimeout(() => {
      setConnStatus('connected');
      const newConn: ActiveConnection = {
        connectorId: selected!.id,
        name: formValues.host ?? formValues.url ?? formValues.account ?? `${selected!.name} connection`,
        tables: Array.from(selectedTables),
        status: 'active',
        lastSync: 'just now',
      };
      setActiveConnections((p) => [newConn, ...p]);
      toast({ title: 'Connection established', description: `${selected!.name} is now syncing.` });
      setTimeout(() => {
        setSelected(null);
        setConnStatus('idle');
        setFormValues({});
        setDetectedTables([]);
        setSelectedTables(new Set());
      }, 1500);
    }, 1500);
  };

  return (
    <DashboardLayout title="Data Connectors" subtitle="Connect to databases and external data sources">
      <div className="space-y-6">
        <PageHeader
          title="Data Connectors"
          subtitle="Integrate databases, data warehouses, and API endpoints"
          badge={{ label: `${activeConnections.length} active`, variant: 'green' }}
        />

        {/* Active connections */}
        {activeConnections.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-[#52525B] font-semibold">Active Connections</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeConnections.map((conn, i) => {
                const cfg = CONNECTORS.find((c) => c.id === conn.connectorId);
                return (
                  <div key={i} className="frammer-card p-4 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: `${cfg?.color}22`, border: `1px solid ${cfg?.color}44` }}
                    >
                      {cfg?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{conn.name}</p>
                      <p className="text-[11px] text-[#52525B]">{conn.tables.length} tables · Synced {conn.lastSync}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[11px] text-green-400">Live</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Connector cards */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-[#52525B] font-semibold">Available Connectors</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONNECTORS.map((conn) => (
              <motion.button
                key={conn.id}
                whileHover={{ y: -2 }}
                onClick={() => { setSelected(conn); setConnStatus('idle'); setFormValues({}); }}
                className="frammer-card p-5 text-left hover:border-[#3F3F46] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: `${conn.color}20`, border: `1px solid ${conn.color}40` }}
                    // @ts-ignore custom prop
                    style={{ backgroundColor: `${conn.color}25`, border: `1px solid ${conn.color}45` }}
                  >
                    <span style={{ color: conn.color }}>{conn.icon}</span>
                  </div>
                  {conn.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                      {conn.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white mb-1">{conn.name}</p>
                <p className="text-xs text-[#71717A] leading-relaxed">{conn.description}</p>
                <div className="flex items-center gap-1 mt-3 text-[11px] text-frammer-red opacity-0 group-hover:opacity-100 transition-opacity">
                  Connect <ChevronRight size={12} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Connection dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setConnStatus('idle'); }}>
        <DialogContent className="bg-[#111111] border-[#27272A] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {selected && (
                <span style={{ color: selected.color }}>{selected.icon}</span>
              )}
              Connect to {selected?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {connStatus === 'idle' && selected && (
              <>
                {selected.fields.length === 0 ? (
                  <p className="text-sm text-[#71717A]">Navigate to Dataset Manager to upload CSV/Excel files.</p>
                ) : (
                  selected.fields.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs text-[#A1A1AA]">{f.label}</Label>
                      <Input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={formValues[f.key] ?? ''}
                        onChange={(e) => setFormValues((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-sm text-white placeholder:text-[#52525B] focus:border-frammer-red/50"
                      />
                    </div>
                  ))
                )}
                {selected.fields.length > 0 && (
                  <Button
                    className="w-full bg-frammer-red hover:bg-frammer-red/90 text-white"
                    onClick={handleConnect}
                  >
                    <Plug size={14} className="mr-2" /> Test Connection
                  </Button>
                )}
              </>
            )}

            {connStatus === 'connecting' && (
              <div className="py-6 text-center space-y-3">
                <Loader2 size={28} className="mx-auto text-frammer-red animate-spin" />
                <p className="text-sm text-[#A1A1AA]">Connecting to {selected?.name}…</p>
              </div>
            )}

            {connStatus === 'tables' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 size={16} /> Connection successful — select tables to ingest
                </div>
                <div className="border border-[#27272A] rounded-xl overflow-hidden">
                  {detectedTables.map((t) => (
                    <label
                      key={t}
                      className="flex items-center gap-3 p-3 hover:bg-white/3 cursor-pointer border-b border-[#1C1C1C] last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTables.has(t)}
                        onChange={(e) => {
                          setSelectedTables((prev) => {
                            const next = new Set(prev);
                            e.target.checked ? next.add(t) : next.delete(t);
                            return next;
                          });
                        }}
                        className="accent-frammer-red"
                      />
                      <Database size={13} className="text-[#52525B]" />
                      <span className="text-sm text-white font-mono">{t}</span>
                    </label>
                  ))}
                </div>
                <Button
                  className="w-full bg-frammer-red hover:bg-frammer-red/90 text-white"
                  disabled={selectedTables.size === 0}
                  onClick={handleIngest}
                >
                  Ingest {selectedTables.size > 0 ? `${selectedTables.size} table${selectedTables.size > 1 ? 's' : ''}` : 'selected tables'}
                </Button>
              </div>
            )}

            {connStatus === 'connected' && (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 size={32} className="mx-auto text-green-400" />
                <p className="text-sm text-white font-medium">Connection established!</p>
                <p className="text-xs text-[#52525B]">Data is being ingested…</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
