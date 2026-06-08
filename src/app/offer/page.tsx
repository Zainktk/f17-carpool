"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./offer.module.css";
import MapPicker from "@/components/MapPicker";

export default function OfferPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const handleDestinationBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query) return;
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " Pakistan")}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role !== "OFFERER") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!user || user.role !== "OFFERER") return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return alert("Please log in first");
    
    setLoading(true);

    if (!destLat || !destLng) {
      alert("Please pin your exact destination on the map.");
      setLoading(false);
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const from = formData.get("from") as string;
    const to = formData.get("to") as string;
    const time = formData.get("time") as string;
    const price = formData.get("price") as string;
    const seats = formData.get("seats") as string;
    
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: user.id,
          from,
          to,
          time,
          price: `Rs. ${price}`,
          totalSeats: seats,
          destLat,
          destLng
        })
      });

      if (res.ok) {
        router.push("/");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create ride.");
        setLoading(false);
      }
    } catch (e) {
      alert("Error submitting ride.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Offer a Ride</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Share your commute with others</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>Leaving from (Location / Society)</label>
          <input name="from" type="text" placeholder="e.g. Bahria Town Phase 7" required defaultValue="F17 Society" />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Going to</label>
          <input 
            name="to" 
            type="text" 
            placeholder="e.g. FAST University" 
            required 
            onBlur={handleDestinationBlur}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Pin exact destination</label>
          <MapPicker 
            onLocationSelect={(l, ln) => { setDestLat(l); setDestLng(ln); }} 
            centerLocation={mapCenter}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Date & Time</label>
          <input name="time" type="text" placeholder="e.g. Tomorrow, 08:00 AM" required />
        </div>

        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label>Available Seats</label>
            <select name="seats" required>
              <option value="1">1 Seat</option>
              <option value="2">2 Seats</option>
              <option value="3">3 Seats</option>
              <option value="4">4 Seats</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Price (Rs.)</label>
            <input name="price" type="number" placeholder="200" required />
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Publishing..." : "Publish Ride"}
        </button>
      </form>
    </div>
  );
}
