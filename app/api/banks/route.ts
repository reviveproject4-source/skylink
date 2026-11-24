import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const banks = await prisma.bankAccount.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(banks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bankName, accountNumber, accountHolder, isActive } = body;

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: "Nama bank, nomor rekening, dan atas nama wajib diisi" },
        { status: 400 }
      );
    }

    const bank = await prisma.bankAccount.create({
      data: {
        bankName,
        accountNumber,
        accountHolder,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json(bank);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
