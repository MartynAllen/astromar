// Best-effort ops alert to a Discord/Slack incoming webhook. Used for the
// things a personal-scale shop still can't afford to miss: a customer
// charged but their print not ordered, an order Prodigi later cancels, a
// margin that's quietly gone underwater. Never throws — an alert failing
// must never mask or block the thing it was trying to report.
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

export async function sendOpsAlert(message: string): Promise<void> {
  if (!ALERT_WEBHOOK_URL) return;
  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    console.error("Ops alert failed:", err);
  }
}
