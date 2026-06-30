import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || firebaseConfig.projectId;

console.log("Initializing firebase-admin with Project ID:", projectId, "and Database ID:", firebaseConfig.firestoreDatabaseId);

if (!getApps().length) {
  initializeApp({
    projectId: projectId,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
// Use the same database ID configured in the applet config
adminDb.settings({
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
});
