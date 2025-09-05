import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const nonce = crypto.randomBytes(16).toString("hex");
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await prisma.walletNonce.create({ data: { userId, nonce, expires } });
  return NextResponse.json({ nonce, expires: expires.toISOString() });
}
