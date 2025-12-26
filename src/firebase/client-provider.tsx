
"use client";

import React from "react";
import { FirebaseProvider, firebaseApp, firestore, auth } from ".";

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseProvider
            firebaseApp={firebaseApp}
            firestore={firestore}
            auth={auth}
        >
            {children}
        </FirebaseProvider>
    );
}
