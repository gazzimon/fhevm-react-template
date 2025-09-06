import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE /api/wallets/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = params.id;

  const w = await prisma.wallet.findUnique({ where: { id } });
  if (!w || w.userId !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.wallet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
