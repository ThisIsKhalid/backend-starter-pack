import cron from "node-cron";

// Initialize all cron jobs
export function initializeCronJobs() {
  // Schedule the example task to run every 12:00 AM
  cron.schedule("* * * * *", async () => {
    // await functionToRun();

    console.log("Example task ran successfully!");
  });
}
