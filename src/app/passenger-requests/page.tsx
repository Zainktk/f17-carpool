"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./requests.module.css";
import Link from "next/link";

export default function PassengerRequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && user.role !== "OFFERER") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("/api/requests");
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error("Failed to fetch requests", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.role === "OFFERER") {
      fetchRequests();
    }
  }, [user]);

  if (authLoading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!user || user.role !== "OFFERER") return null;

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Passenger Requests</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Passengers looking for a ride near your location</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>Scanning area...</div>
      ) : requests.length > 0 ? (
        requests.map((req) => (
          <div key={req.id} className={styles.requestCard}>
            <div className={styles.matchHeader}>
              <span className={styles.riderName}>{req.rider.name}</span>
            </div>
            <div className={styles.route}>
              <strong>{req.from}</strong> → <strong>{req.to}</strong>
            </div>
            <div className={styles.time}>{req.time}</div>
            
            <Link href={`/offer`} style={{ textDecoration: "none" }}>
              <button className={styles.offerBtn} onClick={() => router.push("/offer")}>
                Offer them a Ride
              </button>
            </Link>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>
          <p>No passengers are currently looking for rides in your area.</p>
        </div>
      )}
    </div>
  );
}
