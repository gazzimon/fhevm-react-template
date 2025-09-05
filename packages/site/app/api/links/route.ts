import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreateLinkPayload = { label: string; url: string };

function normalizeUrl(input: string): string {
  let u = (input || "").trim();
  if (!u) throw new Error("empty");
  // Si el usuario pega sin protocolo, asumimos HTTPS
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad_protocol");
    return parsed.toString();
  } catch {
    throw new Error("invalid_url");
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const links = await prisma.externalLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let payload: CreateLinkPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawLabel = (payload.label ?? "").trim();
  const rawUrl = (payload.url ?? "").trim();
  if (!rawLabel || !rawUrl) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const label = rawLabel.slice(0, 50); // límite razonable
  let url: string;
  try {
    url = normalizeUrl(rawUrl);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  // Evitar duplicados por URL para el mismo usuario
  const existing = await prisma.externalLink.findFirst({ where: { userId, url } });
  if (existing) return NextResponse.json(existing, { status: 200 });

  const created = await prisma.externalLink.create({
    data: { userId, label, url },
  });

  return NextResponse.json(created, { status: 201 });
}
