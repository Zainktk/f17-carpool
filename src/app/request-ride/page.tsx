"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./request.module.css";
import Link from "next/link";

export default function RequestRidePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== "BOOKER") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!user || user.role !== "BOOKER") return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return alert("Please log in first");
    
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const from = formData.get("from") as string;
    const to = formData.get("to") as string;
    const time = formData.get("time") as string;
    
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderId: user.id,
          from,
          to,
          time
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches);
        setRequestSent(true);
        setLoading(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create request.");
        setLoading(false);
      }
    } catch (e) {
      alert("Error submitting request.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Request a Ride</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Post your route and drivers will find you</p>
      </div>

      {!requestSent ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Leaving from</label>
            <input name="from" type="text" placeholder="e.g. F17 Society" required defaultValue="F17 Society" />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Going to</label>
            <input name="to" type="text" placeholder="e.g. FAST University" required />
          </div>

          <div className={styles.inputGroup}>
            <label>Date & Time</label>
            <input name="time" type="text" placeholder="e.g. Tomorrow, 08:00 AM" required />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Scanning for matches..." : "Post Request"}
          </button>
        </form>
      ) : (
        <div className={styles.matchesContainer}>
          <div style={{ background: "#e8f5e9", padding: "15px", borderRadius: "8px", marginBottom: "20px", color: "#2e7d32", fontWeight: "bold" }}>
            ✓ Request Posted Successfully!
          </div>

          {matches.length > 0 ? (
            <>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Intelligent Matches 🔥</h2>
              <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "15px" }}>These drivers are heading your way around the same time:</p>
              
              {matches.map((ride) => (
                <div key={ride.id} className={styles.matchCard}>
                  <div className={styles.matchHeader}>
                    <span className={styles.driverName}>{ride.driver.name}</span>
                    <span className={styles.price}>{ride.price}</span>
                  </div>
                  <div className={styles.route}>
                    <strong>{ride.from}</strong> → <strong>{ride.to}</strong>
                  </div>
                  <div className={styles.time}>{ride.time} • {ride.availableSeats} seats left</div>
                  
                  <Link href={`/offer`} style={{ textDecoration: "none" }}>
                    <button className={styles.bookBtn} onClick={() => router.push("/")}>View Ride</button>
                  </Link>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "30px", background: "white", borderRadius: "12px", marginTop: "20px" }}>
              <p>No drivers have posted a matching ride yet.</p>
              <p style={{ fontSize: "0.9rem", color: "#777", marginTop: "10px" }}>We will notify nearby drivers about your request!</p>
              <button className={styles.submitBtn} onClick={() => router.push("/")} style={{ marginTop: "20px" }}>Return Home</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
