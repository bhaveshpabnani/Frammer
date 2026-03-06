import React, { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  UploadCloud,
  FileSpreadsheet,
  FileJson,
  FileText,
  Database,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ColumnProfile {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  isDimension: boolean;
  isMetric: boolean;
  nullPct: number;
  cardinality: number;
  sample: string[];
}

interface DatasetEntry {
  id: string;
  name: string;
  rows: number;
  columns: number;
  fileSize: string;
  fileType: 'csv' | 'excel' | 'json';
  uploadedAt: string;
  status: 'ready' | 'processing' | 'error';
  schema: ColumnProfile[];
}

const MOCK_DATASETS: DatasetEntry[] = [
  {
    id: 'ds-001',
    name: 'combined_data_2025-2026.csv',
    rows: 1996,
    columns: 12,
    fileSize: '1.4 MB',
    fileType: 'csv',
    uploadedAt: '2026-01-15',
    status: 'ready',
    schema: [
      { name: 'video_id', dataType: 'string', isDimension: true, isMetric: false, nullPct: 0, cardinality: 1996, sample: ['VID-0001', 'VID-0002'] },
      { name: 'channel', dataType: 'string', isDimension: true, isMetric: false, nullPct: 0, cardinality: 6, sample: ['YouTube', 'Instagram'] },
      { name: 'language', dataType: 'string', isDimension: true, isMetric: false, nullPct: 1.2, cardinality: 8, sample: ['English', 'Hindi'] },
      { name: 'clips_generated', dataType: 'number', isDimension: false, isMetric: true, nullPct: 0, cardinality: 12, sample: ['6', '8', '4'] },
      { name: 'duration_min', dataType: 'number', isDimension: false, isMetric: true, nullPct: 0, cardinality: 148, sample: ['45', '90', '120'] },
      { name: 'processing_time_min', dataType: 'number', isDimension: false, isMetric: true, nullPct: 2.1, cardinality: 87, sample: ['22', '28', '35'] },
      { name: 'published_flag', dataType: 'boolean', isDimension: true, isMetric: false, nullPct: 0, cardinality: 2, sample: ['true', 'false'] },
      { name: 'uploaded_at', dataType: 'date', isDimension: true, isMetric: false, nullPct: 0, cardinality: 180, sample: ['2025-03-01', '2025-04-15'] },
      { name: 'client', dataType: 'string', isDimension: true, isMetric: false, nullPct: 0, cardinality: 8, sample: ['TechCorp', 'MediaHub'] },
      { name: 'user', dataType: 'string', isDimension: true, isMetric: false, nullPct: 0, cardinality: 12, sample: ['Priya S.', 'Arjun M.'] },
      { name: 'input_type', dataType: 'string', isDimension: true, isMetric: false, nullPct: 0, cardinality: 5, sample: ['Long Video', 'Podcast'] },
      { name: 'output_type', dataType: 'string', isDimension: true, isMetric: false, nullPct: 3.4, cardinality: 7, sample: ['Reel', 'Short'] },
    ],
  },
  {
    id: 'ds-002',
    name: 'channel_metrics_by_month.csv',
    rows: 72,
    columns: 6,
    fileSize: '18 KB',
    fileType: 'csv',
    uploadedAt: '2026-02-01',
    status: 'ready',
    schema: [
      { name: 'month', dataType: 'date', isDimension: true, isMetric: false, nullPct: 0, cardinality: 12, sample: ['2025-03', '2025-04'] },
      { name: 'channel', dataType: 'string', isDimension: true, isMetric: false, nullPct: 0, cardinality: 6, sample: ['YouTube', 'Instagram'] },
      { name: 'videos_processed', dataType: 'number', isDimension: false, isMetric: true, nullPct: 0, cardinality: 72, sample: ['48', '61'] },
      { name: 'clips_generated', dataType: 'number', isDimension: false, isMetric: true, nullPct: 0, cardinality: 72, sample: ['312', '396'] },
      { name: 'hours_processed', dataType: 'number', isDimension: false, isMetric: true, nullPct: 0, cardinality: 72, sample: ['94', '122'] },
      { name: 'avg_processing_min', dataType: 'number', isDimension: false, isMetric: true, nullPct: 4.2, cardinality: 68, sample: ['27', '24'] },
    ],
  },
];

const FILE_TYPE_ICONS = {
  csv: <FileText size={18} className="text-green-400" />,
  excel: <FileSpreadsheet size={18} className="text-emerald-400" />,
  json: <FileJson size={18} className="text-amber-400" />,
};

const DATA_TYPE_COLORS: Record<string, string> = {
  string: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  number: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  date: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  boolean: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetEntry[]>(MOCK_DATASETS);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState<DatasetEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const simulateUpload = useCallback((fileName: string, fileSize: string) => {
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          const newDs: DatasetEntry = {
            id: `ds-${Date.now()}`,
            name: fileName,
            rows: Math.floor(Math.random() * 5000) + 100,
            columns: Math.floor(Math.random() * 15) + 3,
            fileSize,
            fileType: fileName.endsWith('.json') ? 'json' : fileName.endsWith('.xlsx') ? 'excel' : 'csv',
            uploadedAt: new Date().toISOString().slice(0, 10),
            status: 'ready',
            schema: [
              { name: 'id', dataType: 'string', isDimension: true, isMetric: false, nullPct: 0, cardinality: 0, sample: [] },
              { name: 'value', dataType: 'number', isDimension: false, isMetric: true, nullPct: 0, cardinality: 0, sample: [] },
              { name: 'date', dataType: 'date', isDimension: true, isMetric: false, nullPct: 0, cardinality: 0, sample: [] },
            ],
          };
          setDatasets((prev) => [newDs, ...prev]);
          toast({ title: 'Dataset uploaded', description: `${fileName} is ready to use.` });
          return 100;
        }
        return p + 8;
      });
    }, 120);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const size = file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
      simulateUpload(file.name, size);
    }
  }, [simulateUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const size = file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
      simulateUpload(file.name, size);
    }
  };

  const toggleColumnProperty = (dsId: string, colName: string, prop: 'isDimension' | 'isMetric') => {
    setDatasets((prev) =>
      prev.map((ds) =>
        ds.id !== dsId
          ? ds
          : {
              ...ds,
              schema: ds.schema.map((col) =>
                col.name !== colName ? col : { ...col, [prop]: !col[prop] }
              ),
            }
      )
    );
  };

  return (
    <DashboardLayout title="Dataset Manager" subtitle="Upload and profile your data sources">
      <div className="space-y-6">
        <PageHeader
          title="Dataset Manager"
          subtitle="Upload, profile and configure data sources for analytics"
          badge={{ label: `${datasets.length} datasets`, variant: 'blue' }}
        />

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
            dragging ? 'border-frammer-red/60 bg-frammer-red/5' : 'border-[#27272A] hover:border-[#3F3F46] hover:bg-white/2'
          )}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFileSelect}
          />
          {uploading ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <RefreshCw size={28} className="mx-auto text-frammer-red animate-spin" />
              <p className="text-sm text-white">Processing dataset…</p>
              <Progress value={uploadProgress} className="h-1.5" />
              <p className="text-xs text-[#52525B]">{uploadProgress}% — detecting schema</p>
            </div>
          ) : (
            <>
              <UploadCloud size={36} className={cn('mx-auto mb-3', dragging ? 'text-frammer-red' : 'text-[#3F3F46]')} />
              <p className="text-sm font-medium text-white mb-1">
                {dragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-[#52525B]">CSV, Excel (.xlsx), JSON — up to 100 MB</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                {(['CSV', 'Excel', 'JSON'] as const).map((t) => (
                  <span key={t} className="text-[11px] px-2 py-1 rounded border border-[#27272A] text-[#52525B]">{t}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Dataset list */}
        <div className="space-y-3">
          {datasets.map((ds) => (
            <div key={ds.id} className="frammer-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#27272A] flex items-center justify-center shrink-0">
                  {FILE_TYPE_ICONS[ds.fileType]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white truncate">{ds.name}</p>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
                        ds.status === 'ready' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                        ds.status === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                        'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      )}
                    >
                      {ds.status === 'ready' ? '✓ Ready' : ds.status === 'error' ? '✗ Error' : '⟳ Processing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#52525B]">
                    <span><span className="font-metric text-[#71717A]">{ds.rows.toLocaleString()}</span> rows</span>
                    <span><span className="font-metric text-[#71717A]">{ds.columns}</span> columns</span>
                    <span>{ds.fileSize}</span>
                    <span>Uploaded {ds.uploadedAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDataset(ds)}
                    className="h-8 text-xs text-[#71717A] hover:text-white"
                  >
                    <Eye size={13} className="mr-1.5" /> Schema
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDatasets((p) => p.filter((d) => d.id !== ds.id))}
                    className="h-8 text-xs text-[#71717A] hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schema modal */}
      <Dialog open={!!selectedDataset} onOpenChange={() => setSelectedDataset(null)}>
        <DialogContent className="bg-[#111111] border-[#27272A] max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-base">{selectedDataset?.name} — Schema</DialogTitle>
          </DialogHeader>
          {selectedDataset && (
            <div className="space-y-3">
              <div className="flex gap-4 text-xs text-[#52525B]">
                <span><span className="font-metric text-white">{selectedDataset.rows.toLocaleString()}</span> rows</span>
                <span><span className="font-metric text-white">{selectedDataset.columns}</span> columns</span>
                <span><span className="font-metric text-white">{selectedDataset.schema.filter((c) => c.isMetric).length}</span> metrics detected</span>
                <span><span className="font-metric text-white">{selectedDataset.schema.filter((c) => c.isDimension).length}</span> dimensions detected</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#27272A] hover:bg-transparent">
                    {['Column Name', 'Data Type', 'Null %', 'Cardinality', 'Sample Values', 'Is Dimension', 'Is Metric'].map((h) => (
                      <TableHead key={h} className="text-[11px] uppercase tracking-wider text-[#52525B] py-2">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDataset.schema.map((col) => (
                    <TableRow key={col.name} className="border-[#27272A] hover:bg-white/2">
                      <TableCell className="py-2.5 text-xs text-white font-medium font-mono">{col.name}</TableCell>
                      <TableCell className="py-2.5">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', DATA_TYPE_COLORS[col.dataType])}>
                          {col.dataType}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs font-metric text-[#71717A]">
                        <span className={col.nullPct > 5 ? 'text-red-400' : 'text-[#71717A]'}>
                          {col.nullPct.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs font-metric text-[#71717A]">{col.cardinality.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {col.sample.slice(0, 2).map((s, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C1C1C] border border-[#27272A] text-[#71717A] font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Switch
                          checked={col.isDimension}
                          onCheckedChange={() => toggleColumnProperty(selectedDataset.id, col.name, 'isDimension')}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Switch
                          checked={col.isMetric}
                          onCheckedChange={() => toggleColumnProperty(selectedDataset.id, col.name, 'isMetric')}
                          className="data-[state=checked]:bg-frammer-red"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs"
                  onClick={() => {
                    setSelectedDataset(null);
                    toast({ title: 'Schema saved', description: 'Column definitions updated.' });
                  }}
                >
                  Save Schema
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
