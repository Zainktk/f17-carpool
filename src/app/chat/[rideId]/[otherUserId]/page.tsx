"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./chat.module.css";

export default function ChatPage({ params }: { params: Promise<{ rideId: string, otherUserId: string }> }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // React 19 unwrapping of params
  const { rideId, otherUserId } = use(params);

  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?rideId=${rideId}&otherUserId=${otherUserId}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        const err = await res.json();
        console.error("fetchMessages error:", err);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [user, authLoading, rideId, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    // Optimistic UI
    const tempMsg = {
      id: Date.now(),
      senderId: user.id,
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setContent("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rideId,
          receiverId: otherUserId,
          content: tempMsg.content
        })
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("send error:", err);
      }
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) return <div style={{ padding: 40, textAlign: "center" }}>Loading Chat...</div>;
  if (!user) return <div style={{ padding: 40, textAlign: "center" }}>Please log in to chat.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>
        <h1 className={styles.title}>Chat</h1>
      </header>

      <div className={styles.messageList}>
        {messages.length === 0 ? (
          <div className={styles.empty}>Send a message to coordinate your ride.</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`${styles.messageWrapper} ${isMe ? styles.me : styles.them}`}>
                <div className={styles.bubble}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <input 
          type="text" 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder="Type a message..." 
          className={styles.input}
        />
        <button type="submit" className={styles.sendBtn} disabled={!content.trim()}>Send</button>
      </form>
    </div>
  );
}
