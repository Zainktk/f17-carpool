import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

(self as any).addEventListener("push", (event: any) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon512_maskable.png",
      badge: "/icon512_maskable.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    };
    event.waitUntil((self as any).registration.showNotification(data.title, options));
  }
});

(self as any).addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, (self as any).location.origin).href;
  
  event.waitUntil(
    (self as any).clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients: any[]) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow(urlToOpen);
      }
    })
  );
});
