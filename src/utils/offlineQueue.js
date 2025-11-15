// Offline request queue manager
class OfflineQueue {
  constructor() {
    this.queueKey = 'offline-request-queue';
    this.isOnline = navigator.onLine;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => {
      console.log('[OfflineQueue] Network online');
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineQueue] Network offline');
      this.isOnline = false;
    });
  }

  // Get all queued requests
  getQueue() {
    try {
      const queue = localStorage.getItem(this.queueKey);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('[OfflineQueue] Error reading queue:', error);
      return [];
    }
  }

  // Save queue to localStorage
  saveQueue(queue) {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('[OfflineQueue] Error saving queue:', error);
    }
  }

  // Add request to queue
  addToQueue(request) {
    const queue = this.getQueue();
    const queuedRequest = {
      id: Date.now() + Math.random(),
      url: request.url,
      method: request.method || 'POST',
      headers: request.headers || {},
      body: request.body,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    queue.push(queuedRequest);
    this.saveQueue(queue);
    console.log('[OfflineQueue] Request queued:', queuedRequest.id);

    return queuedRequest.id;
  }

  // Remove request from queue
  removeFromQueue(requestId) {
    const queue = this.getQueue();
    const newQueue = queue.filter((req) => req.id !== requestId);
    this.saveQueue(newQueue);
    console.log('[OfflineQueue] Request removed:', requestId);
  }

  // Process all queued requests
  async processQueue() {
    if (!this.isOnline) {
      console.log('[OfflineQueue] Offline - skipping queue processing');
      return;
    }

    const queue = this.getQueue();
    console.log('[OfflineQueue] Processing queue:', queue.length, 'requests');

    if (queue.length === 0) {
      return;
    }

    const results = [];

    for (const request of queue) {
      try {
        console.log('[OfflineQueue] Processing request:', request.id);

        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });

        if (response.ok) {
          console.log('[OfflineQueue] Request succeeded:', request.id);
          this.removeFromQueue(request.id);
          results.push({ id: request.id, success: true });
        } else {
          console.error('[OfflineQueue] Request failed:', request.id, response.status);
          request.retries += 1;

          // Remove after 3 retries
          if (request.retries >= 3) {
            console.error('[OfflineQueue] Max retries reached, removing:', request.id);
            this.removeFromQueue(request.id);
            results.push({ id: request.id, success: false, error: 'Max retries exceeded' });
          } else {
            // Update retry count
            const queue = this.getQueue();
            const index = queue.findIndex((r) => r.id === request.id);
            if (index !== -1) {
              queue[index] = request;
              this.saveQueue(queue);
            }
            results.push({ id: request.id, success: false, error: 'Retry scheduled' });
          }
        }
      } catch (error) {
        console.error('[OfflineQueue] Request error:', request.id, error);
        results.push({ id: request.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // Clear entire queue
  clearQueue() {
    this.saveQueue([]);
    console.log('[OfflineQueue] Queue cleared');
  }

  // Get queue size
  getQueueSize() {
    return this.getQueue().length;
  }
}

// Create singleton instance
const offlineQueue = new OfflineQueue();

export default offlineQueue;
