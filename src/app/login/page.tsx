"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "../signup/signup.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        await refreshUser();
        router.push("/");
      } else {
        const err = await res.json();
        // If the user hasn't verified their email yet, redirect to OTP page
        if (err.needsVerification) {
          router.push(`/verify-otp?email=${encodeURIComponent(err.email)}`);
          return;
        }
        setErrorMsg(err.error || "Login failed");
        setLoading(false);
      }
    } catch (e) {
      setErrorMsg("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome Back</h1>
      
      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>Email</label>
          <input name="email" type="email" placeholder="ali@example.com" required />
        </div>

        <div className={styles.inputGroup}>
          <label>Password</label>
          <input name="password" type="password" required />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        <div className={styles.loginLink}>
          Don't have an account? <Link href="/signup">Sign up</Link>
        </div>
      </form>
    </div>
  );
}
