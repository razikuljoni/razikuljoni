export const prerender = false;

import { checkRateLimit } from '../../lib/ratelimit';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export const POST = async ({ request }: { request: Request }) => {
    // Rate limit: 10 requests per 10 seconds per IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || 'unknown';
    const { success } = await checkRateLimit(`contact:${ip}`);
    if (!success) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
        });
    }

    let data;
    try {
        data = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const subject = typeof data.subject === 'string' ? data.subject.trim() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';

    const missing = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!subject) missing.push("subject");
    if (!message) missing.push("message");

    if (missing.length > 0) {
        return new Response(JSON.stringify({ error: `Missing required fields: ${missing.join(", ")}` }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email address format" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Sanitize input lengths
    if (name.length > 100 || subject.length > 200 || message.length > 3000) {
        return new Response(JSON.stringify({ error: "Input text exceeds maximum allowed limit" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || (import.meta.env ? (import.meta.env.BOT_TOKEN || import.meta.env.TELEGRAM_BOT_TOKEN) : undefined);
    const CHAT_ID = process.env.CHAT_ID || process.env.TELEGRAM_CHAT_ID || (import.meta.env ? (import.meta.env.CHAT_ID || import.meta.env.TELEGRAM_CHAT_ID) : undefined);

    if (!BOT_TOKEN || !CHAT_ID) {
        console.error("Missing Telegram credentials (BOT_TOKEN / CHAT_ID)");
        return new Response(
            JSON.stringify({ error: "Messaging service is offline (missing Telegram credentials). Please email directly." }),
            {
                status: 503,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const htmlMessage = `📩 <b>New Contact Form Submission</b>\n\n👤 <b>Name:</b> ${escapeHtml(name)}\n📧 <b>Email:</b> ${escapeHtml(email)}\n📝 <b>Subject:</b> ${escapeHtml(subject)}\n\n💬 <b>Message:</b>\n${escapeHtml(message)}`;
    const plainTextMessage = `📩 New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`;

    try {
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        let response = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: htmlMessage,
                parse_mode: "HTML",
            }),
        });

        // Fallback to plain text if HTML send fails
        if (!response.ok) {
            console.warn("HTML Telegram send failed, attempting plain text fallback...");
            response = await fetch(telegramUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: plainTextMessage,
                }),
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Telegram API Error:", errorText);
            throw new Error(`Telegram API failed: ${response.statusText}`);
        }

        return new Response(
            JSON.stringify({ message: "Message sent successfully" }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("Failed to send telegram message:", error);
        return new Response(JSON.stringify({ error: "Failed to send message via notification service" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
