import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { ContactMessage } from "@/models/ContactMessage";

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  await connectDb();
  const saved = await ContactMessage.create({ name, email, subject, message });

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return NextResponse.json({ error: "Discord webhook URL is not set" }, { status: 400 });
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: [
          "New PrepDrive contact submission",
          `Name: ${name}`,
          `Email: ${email}`,
          `Subject: ${subject || "-"}`,
          `Message: ${message}`,
        ].join("\n"),
      }),
    });
  } catch {
    // Keep contact form success even if webhook delivery fails.
  }

  return NextResponse.json({ ok: true, id: saved._id.toString() });
}
