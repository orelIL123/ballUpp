import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseAdminService {
  private readonly app: App;

  constructor() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const serviceAccount =
      serviceAccountPath && !clientEmail
        ? JSON.parse(readFileSync(resolve(process.cwd(), serviceAccountPath), 'utf8')) as {
            project_id: string;
            client_email: string;
            private_key: string;
          }
        : null;

    const resolvedProjectId = serviceAccount?.project_id ?? projectId;
    const resolvedClientEmail = serviceAccount?.client_email ?? clientEmail;
    const resolvedPrivateKey = serviceAccount?.private_key ?? privateKey;

    this.app =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            credential:
              resolvedProjectId && resolvedClientEmail && resolvedPrivateKey
                ? cert({
                    projectId: resolvedProjectId,
                    clientEmail: resolvedClientEmail,
                    privateKey: resolvedPrivateKey,
                  })
                : undefined,
          });
  }

  auth() {
    return getAuth(this.app);
  }

  firestore() {
    return getFirestore(this.app);
  }
}
