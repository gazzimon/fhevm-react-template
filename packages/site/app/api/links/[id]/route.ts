import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeUrl(input: string): string {
  let u = (input || "").trim();
  if (!u) throw new Error("empty");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad_protocol");
  return parsed.toString();
}

// PATCH /api/links/[id]  { label?: string; url?: string }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await req.json().catch(() => ({}));
  let { label, url } = body as { label?: string; url?: string };

  if (!label && !url) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const link = await prisma.externalLink.findUnique({ where: { id } });
  if (!link || link.userId !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (label) label = String(label).trim().slice(0, 50);
  if (url) {
    try {
      url = normalizeUrl(String(url));
    } catch {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }
    // Evitar duplicados de URL para el mismo usuario (distinto id)
    const dup = await prisma.externalLink.findFirst({
      where: { userId, url, NOT: { id } },
    });
    if (dup) {
      return NextResponse.json({ error: "duplicate_url" }, { status: 409 });
    }
  }

  const updated = await prisma.externalLink.update({
    where: { id },
    data: {
      ...(label ? { label } : {}),
      ...(url ? { url } : {}),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/links/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = params.id;
  const link = await prisma.externalLink.findUnique({ where: { id } });
  if (!link || link.userId !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.externalLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
