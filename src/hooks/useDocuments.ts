import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { VehicleDocument } from '../models';

export function useDocuments(vehicleId: string | undefined) {
  const documents = useLiveQuery(
    () =>
      vehicleId
        ? db.documents.where('vehicleId').equals(vehicleId).toArray()
        : Promise.resolve([] as VehicleDocument[]),
    [vehicleId],
  );

  const addDocument = async (data: Omit<VehicleDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    await db.documents.add({ ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
  };

  const updateDocument = async (id: string, data: Partial<Omit<VehicleDocument, 'id' | 'createdAt'>>) => {
    await db.documents.update(id, { ...data, updatedAt: new Date() });
  };

  const deleteDocument = async (id: string) => {
    await db.documents.delete(id);
  };

  return { documents: documents ?? [], addDocument, updateDocument, deleteDocument };
}
