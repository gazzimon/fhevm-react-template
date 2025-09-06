import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { utils } from "ethers"; // ✅ v5

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { signature, nonce, kind = "metamask" } = await req.json();
  if (!signature || !nonce) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const n = await prisma.walletNonce.findUnique({ where: { nonce } });
  if (!n || n.userId !== userId || n.expires < new Date()) {
    return NextResponse.json({ error: "invalid nonce" }, { status: 400 });
  }

  const message = `Link wallet to LIVRA\nNonce: ${nonce}`;

  let recovered: string;
  try {
    recovered = utils.verifyMessage(message, signature); // ✅ v5
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  const address = utils.getAddress(recovered); // ✅ v5

  const saved = await prisma.wallet.upsert({
    where: { address_kind: { address, kind } },
    update: {},
    create: { userId, address, kind },
  });

  // invalidar el nonce usado
  await prisma.walletNonce.delete({ where: { nonce } });

  return NextResponse.json(saved);
}
