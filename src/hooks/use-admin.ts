"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useUser, useFirestore } from "@/firebase";

export function useAdmin() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user || !db) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const adminDocRef = doc(db, "roles_admin", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        setIsAdmin(adminDocSnap.exists());
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      checkAdminStatus();
    }
  }, [user, userLoading, db]);

  return { isAdmin, loading: userLoading || loading };
}
