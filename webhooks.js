import { DISCORD_WEBHOOK_URL } from "./constants.js";
import { toast } from "./toasts.js";
import { getDomElements } from "./domElements.js";

export async function sendDiscordWebhook(rentalDetails, discordUser, rentalReason) {
  const { progressBar, confirmCheckoutBtn } = getDomElements();

  confirmCheckoutBtn.disabled = true;
  confirmCheckoutBtn.textContent = "Processing...";
  progressBar.style.width = '0%';
  progressBar.style.opacity = '1';

  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    if (progress <= 100) {
      progressBar.style.width = `${progress}%`;
    } else {
      clearInterval(interval);
    }
  }, 100);

  try {
    const grandTotal = rentalDetails.reduce((sum, item) => sum + item.total, 0);

    // Constructing each card item.
    // Each item's content starts immediately, using explicit newlines for formatting.
    // The .join('\n\n') will then add two newlines between each card block.
    const cardDetailsMarkdown = rentalDetails.map(item => `Card: ${item.name}
> Element: ${item.element}
> Rarity: ${item.rarity}
> Start Date: ${item.startDate}
> Duration: ${item.duration} days
> Price: ${item.total.toLocaleString()} coins`
    ).join('\n\n');

    const descriptionContent = `\`\`\`md
# Rental Overview
User: ${discordUser}
Reason: ${rentalReason}
Grand Total: ${grandTotal.toLocaleString()} coins

# Rented Cards
${cardDetailsMarkdown}
\`\`\``;

    const discordPayload = {
      embeds: [
        {
          title: `Rental Request by ${discordUser}`,
          description: descriptionContent,
          color: 0xA5B4FC,
          footer: {
            text: `Saelogy Card Rentals`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    toast("Rental request submitted successfully! Check Discord for updates.", "success");
    return true;

  } catch (error) {
    console.error("Error confirming rental:", error);
    toast("Failed to submit rental request. Please try again later.", "error");
    return false;
  } finally {
    clearInterval(interval);
    progressBar.style.width = '100%';
    setTimeout(() => {
      progressBar.style.opacity = '0';
    }, 500);
    confirmCheckoutBtn.disabled = false;
    confirmCheckoutBtn.textContent = "Confirm rental(s)";
  }
}
