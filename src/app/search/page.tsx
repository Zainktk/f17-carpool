"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./search.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [from, setFrom] = useState("F17 Society");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    router.push(`/?${params.toString()}`);
  };

  useEffect(() => {
    if (!loading && user && user.role !== "BOOKER") {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!user || user.role !== "BOOKER") return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Find a Ride</h1>
      
      <div className={styles.searchBox}>
        <div className={styles.inputGroup}>
          <label>Leaving from</label>
          <input type="text" value={from} onChange={e => setFrom(e.target.value)} placeholder="e.g. F17 Society" />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Going to</label>
          <input type="text" value={to} onChange={e => setTo(e.target.value)} placeholder="e.g. NUST University" />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        
        <button className={styles.searchBtn} onClick={handleSearch}>Search Rides</button>
      </div>

      <div className={styles.recentSearches}>
        <h3>Popular Destinations</h3>
        <div>
          {["FAST University", "NUST University", "Blue Area", "Islamabad Airport", "Centaurus Mall"].map(dest => (
            <span key={dest} className={styles.tag} onClick={() => { setTo(dest); handleSearch(); }}>
              {dest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
