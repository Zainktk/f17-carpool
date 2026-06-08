"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

const HomeIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SearchIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ActivityIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ProfileIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname === "/login" || pathname === "/signup" || pathname === "/verify-otp" || pathname.startsWith("/chat")) return null;

  return (
    <nav className={`${styles.bottomNav} glass`}>
      <Link href="/" className={`${styles.navItem} ${pathname === "/" ? styles.active : ""}`}>
        <HomeIcon />
        <span className={styles.label}>Home</span>
      </Link>
      
      {(!user || user.role === "BOOKER") && (
        <Link href="/search" className={`${styles.navItem} ${pathname === "/search" ? styles.active : ""}`}>
          <SearchIcon />
          <span className={styles.label}>Search</span>
        </Link>
      )}
      
      {user?.role === "OFFERER" && (
        <Link href="/offer" className={styles.navItem}>
          <div className={styles.fab}>
            <PlusIcon />
          </div>
        </Link>
      )}
      
      <Link href="/activity" className={`${styles.navItem} ${pathname === "/activity" ? styles.active : ""}`}>
        <ActivityIcon />
        <span className={styles.label}>Activity</span>
      </Link>
      
      <Link href="/profile" className={`${styles.navItem} ${pathname === "/profile" ? styles.active : ""}`}>
        <ProfileIcon />
        <span className={styles.label}>Profile</span>
      </Link>
    </nav>
  );
}
