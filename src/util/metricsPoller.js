import { getPrometheusMetrics } from './api';

const subscribers = new Set();
let latestMetrics = null;
let latestError = null;
let isLoading = false;
let intervalId = null;

const POLL_INTERVAL_MS = 10000;

async function fetchAndNotify() {
  try {
    isLoading = true;
    const data = await getPrometheusMetrics();
    latestMetrics = data;
    latestError = null;
  } catch (error) {
    latestError = error;
  } finally {
    isLoading = false;
    // notify all subscribers with current snapshot
    subscribers.forEach((cb) => {
      try {
        cb({ metrics: latestMetrics, loading: isLoading, error: latestError });
      } catch (error) {
        console.error('Subscriber callback error:', error);
        latestError = error;
      }
    });
  }
}

function start() {
  if (intervalId) return;
  // immediate fetch then set interval
  fetchAndNotify();
  intervalId = setInterval(fetchAndNotify, POLL_INTERVAL_MS);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function subscribe(callback) {
  subscribers.add(callback);
  // start polling when first subscriber appears
  if (subscribers.size === 1) start();
  // push current snapshot immediately
  callback({ metrics: latestMetrics, loading: isLoading, error: latestError });

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) stop();
  };
}

export function getSnapshot() {
  return { metrics: latestMetrics, loading: isLoading, error: latestError };
}


