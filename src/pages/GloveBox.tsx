import { useState, useEffect, useMemo } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import type { VehicleDocument } from '../models';
import { formatInputDate } from '../utils/formatters';
import DocumentCard from '../components/features/DocumentCard';
import EmptyState from '../components/ui/EmptyState';
import ReceiptUpload from '../components/ui/ReceiptUpload';
import ReceiptViewer from '../components/ui/ReceiptViewer';
import Button from '../components/ui/Button';
import { FormField, Input } from '../components/ui/FormField';
import ConfirmDialog from '../components/ui/ConfirmDialog';

type DocType = VehicleDocument['type'];

const TABS: { value: DocType; label: string }[] = [
  { value: 'insurance',    label: 'Insurance'    },
  { value: 'registration', label: 'Registration' },
  { value: 'warranty',     label: 'Warranty'     },
  { value: 'other',        label: 'Other'        },
];

const EXPIRY_TYPES: DocType[] = ['insurance', 'registration'];

interface DocForm {
  title: string;
  expiresAt: string;
  imageData: string;
  fileName: string | undefined;
}

function emptyDocForm(type: DocType): DocForm {
  return {
    title: TABS.find((t) => t.value === type)?.label ?? '',
    expiresAt: '',
    imageData: '',
    fileName: undefined,
  };
}

// Discriminated union for add vs edit state — avoids the 'new' string sentinel
type EditingDoc = { mode: 'add' } | { mode: 'edit'; doc: VehicleDocument };

interface Props {
  vehicleId: string;
  onClose: () => void;
}

export default function GloveBox({ vehicleId, onClose }: Props) {
  const { documents, addDocument, updateDocument, deleteDocument } = useDocuments(vehicleId);
  const [activeTab, setActiveTab] = useState<DocType>('insurance');
  const [editingDoc, setEditingDoc] = useState<EditingDoc | null>(null);
  const [docForm, setDocForm] = useState<DocForm>(emptyDocForm('insurance'));
  const [viewingDoc, setViewingDoc] = useState<VehicleDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Prevent body scroll on iOS Safari while the sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Single pass over documents — count + expiry flag per tab
  const tabStats = useMemo(() => {
    const now = Date.now();
    const map = new Map<DocType, { count: number; hasExpiring: boolean }>(
      TABS.map((t) => [t.value, { count: 0, hasExpiring: false }]),
    );
    for (const d of documents) {
      const s = map.get(d.type);
      if (!s) continue;
      s.count++;
      if (!s.hasExpiring && d.expiresAt &&
          (new Date(d.expiresAt).getTime() - now) / 86400000 <= 30) {
        s.hasExpiring = true;
      }
    }
    return map;
  }, [documents]);

  const tabDocs = documents.filter((d) => d.type === activeTab);
  const showExpiry = EXPIRY_TYPES.includes(activeTab);

  const openAdd = () => {
    setDocForm(emptyDocForm(activeTab));
    setEditingDoc({ mode: 'add' });
  };

  const openEdit = (doc: VehicleDocument) => {
    setDocForm({
      title: doc.title,
      expiresAt: doc.expiresAt ? formatInputDate(doc.expiresAt) : '',
      imageData: doc.imageData,
      fileName: doc.fileName,
    });
    setEditingDoc({ mode: 'edit', doc });
  };

  const closeForm = () => setEditingDoc(null);

  const handleSave = async () => {
    if (!docForm.imageData || !docForm.title.trim()) return;
    setSaving(true);
    try {
      const data = {
        vehicleId,
        type: activeTab,
        title: docForm.title.trim(),
        imageData: docForm.imageData,
        fileName: docForm.fileName,
        expiresAt: docForm.expiresAt ? new Date(docForm.expiresAt) : undefined,
      };
      if (editingDoc?.mode === 'add') {
        await addDocument(data);
      } else if (editingDoc?.mode === 'edit') {
        await updateDocument(editingDoc.doc.id, data);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // Guard is safe: Delete button only renders when editingDoc.mode === 'edit'
    if (editingDoc?.mode === 'edit') {
      await deleteDocument(editingDoc.doc.id);
      closeForm();
    }
    setConfirmDelete(false);
  };

  const activeTabLabel = TABS.find((t) => t.value === activeTab)?.label ?? '';

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white/50 backdrop-blur-2xl border-t border-x border-white/70 shadow-glass dark:bg-[#080E1C]/80 dark:border-white/[0.12] dark:shadow-glass-dark rounded-t-3xl flex flex-col animate-slide-up"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - 24px)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/[0.15]" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/[0.08] flex-shrink-0">
          <h2 className="text-lg font-bold text-black dark:text-white">Documents</h2>
          <div className="flex items-center gap-2">
            {editingDoc === null && (
              <button
                onClick={openAdd}
                className="w-8 h-8 rounded-full bg-ios-blue flex items-center justify-center"
                aria-label="Add document"
              >
                <Plus size={16} className="text-white" />
              </button>
            )}
            <button
              onClick={editingDoc ? closeForm : onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.10] flex items-center justify-center"
            >
              <X size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {editingDoc === null && (
          <div className="flex border-b border-gray-100 dark:border-white/[0.08] flex-shrink-0">
            {TABS.map((t) => {
              const { count, hasExpiring } = tabStats.get(t.value) ?? { count: 0, hasExpiring: false };
              return (
                <button
                  key={t.value}
                  onClick={() => setActiveTab(t.value)}
                  className={`flex-1 py-2.5 text-xs font-semibold relative transition-colors ${
                    activeTab === t.value
                      ? 'text-ios-blue border-b-2 border-ios-blue'
                      : 'text-ios-gray dark:text-gray-400'
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">{count}</span>
                  )}
                  {hasExpiring && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-ios-orange" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto scroll-area">
          {editingDoc !== null ? (
            <div className="px-5 py-4 space-y-4 pb-8">
              <p className="text-base font-bold text-black dark:text-white">
                {editingDoc.mode === 'add' ? `Add ${activeTabLabel}` : 'Edit Document'}
              </p>

              <FormField label="Title" required>
                <Input
                  value={docForm.title}
                  onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Progressive Insurance"
                />
              </FormField>

              {showExpiry && (
                <FormField label="Expiry Date" hint="Optional — shows warning when within 30 days">
                  <Input
                    type="date"
                    value={docForm.expiresAt}
                    onChange={(e) => setDocForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  />
                </FormField>
              )}

              <FormField label="Document" required>
                <ReceiptUpload
                  value={docForm.imageData || undefined}
                  fileName={docForm.fileName}
                  onChange={(dataUrl, name) => setDocForm((p) => ({ ...p, imageData: dataUrl, fileName: name }))}
                  onRemove={() => setDocForm((p) => ({ ...p, imageData: '', fileName: undefined }))}
                />
              </FormField>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={handleSave}
                  fullWidth
                  loading={saving}
                  size="lg"
                  disabled={!docForm.imageData || !docForm.title.trim()}
                >
                  {editingDoc.mode === 'add' ? 'Save Document' : 'Save Changes'}
                </Button>
                {editingDoc.mode === 'edit' && (
                  <Button
                    onClick={() => setConfirmDelete(true)}
                    variant="danger"
                    fullWidth
                    size="lg"
                  >
                    Delete Document
                  </Button>
                )}
                <Button onClick={closeForm} variant="secondary" fullWidth size="lg">
                  Cancel
                </Button>
              </div>
            </div>
          ) : tabDocs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={`No ${activeTabLabel} documents`}
              description="Tap + to add a photo or PDF of your documents."
              action={{ label: 'Add Document', onClick: openAdd }}
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.07]">
              {tabDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onTap={() => setViewingDoc(doc)}
                  onEdit={() => openEdit(doc)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {viewingDoc && (
        <ReceiptViewer
          dataUrl={viewingDoc.imageData}
          fileName={viewingDoc.fileName ?? viewingDoc.title}
          onClose={() => setViewingDoc(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete Document?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
