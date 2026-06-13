import { NextRequest, NextResponse } from "next/server";
import { validateBtcAddress } from "@/lib/utils/validation";
import { prepareInscriptionPayload } from "@/lib/bitcoin/inscription";
import { BTC_FEE_RATES } from "@/lib/utils/constants";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse } from "@/types/api";
import type { OrdinalsAddressInfo, OrdinalsInscription } from "@/types/ordinals";

const HIRO_API_URL = "https://api.hiro.so";

interface HiroInscription {
  id: string;
  number: number;
  address: string;
  content_type: string;
  content_length: number;
  sat_ordinal: string;
  location: string;
  timestamp: number;
  genesis_tx_id: string;
  tx_id: string;
  genesis_fee: string;
}

function toInscription(raw: HiroInscription): OrdinalsInscription {
  return {
    id: raw.id,
    number: raw.number,
    address: raw.address,
    content_type: raw.content_type,
    content_length: raw.content_length,
    sat: Number(raw.sat_ordinal),
    satpoint: raw.location,
    timestamp: raw.timestamp,
    genesis_tx_id: raw.genesis_tx_id,
    current_tx_id: raw.tx_id,
    owner: raw.address,
    fee: Number(raw.genesis_fee),
  };
}

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, "ordinals");
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address");
  const genesisAddress = searchParams.get("genesis_address");
  const id = searchParams.get("id");

  if (!address && !genesisAddress && !id) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Provide an address, genesis_address, or id query parameter" },
      { status: 400 }
    );
  }

  if (address || genesisAddress) {
    const lookupAddress = (address ?? genesisAddress) as string;
    const addressError = validateBtcAddress(lookupAddress);
    if (addressError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: addressError }, { status: 400 });
    }

    const queryParam = address ? `address=${encodeURIComponent(address)}` : `genesis_address=${encodeURIComponent(genesisAddress as string)}`;
    const res = await fetch(`${HIRO_API_URL}/ordinals/v1/inscriptions?${queryParam}`);
    if (!res.ok) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: `Ordinals lookup failed with status ${res.status}` },
        { status: 502 }
      );
    }

    const json: { total: number; results: HiroInscription[] } = await res.json();
    const inscriptions = json.results.map(toInscription);

    const info: OrdinalsAddressInfo = {
      address: lookupAddress,
      inscriptions,
      total_inscriptions: json.total,
      total_size: inscriptions.reduce((sum, i) => sum + i.content_length, 0),
    };

    return NextResponse.json<ApiResponse<OrdinalsAddressInfo>>({ success: true, data: info });
  }

  const res = await fetch(`${HIRO_API_URL}/ordinals/v1/inscriptions/${encodeURIComponent(id as string)}`);
  if (!res.ok) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `Ordinals lookup failed with status ${res.status}` },
      { status: 502 }
    );
  }

  const json: HiroInscription = await res.json();
  return NextResponse.json<ApiResponse<OrdinalsInscription>>({ success: true, data: toInscription(json) });
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "ordinals");
  if (limited) return limited;

  let body: {
    contentType?: string;
    contentSizeBytes?: number;
    recipient?: string;
    feeRate?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { contentType, contentSizeBytes, recipient, feeRate } = body;

  if (!contentType) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "contentType is required" }, { status: 400 });
  }

  if (!contentSizeBytes || contentSizeBytes <= 0) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "contentSizeBytes must be a positive number" },
      { status: 400 }
    );
  }

  if (!recipient) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "recipient is required" }, { status: 400 });
  }

  const addressError = validateBtcAddress(recipient);
  if (addressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: addressError }, { status: 400 });
  }

  const rate = feeRate ?? BTC_FEE_RATES.standard;
  if (rate <= 0) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "feeRate must be a positive number" }, { status: 400 });
  }

  const prepared = prepareInscriptionPayload({ contentType, contentSizeBytes, recipient, feeRate: rate });

  return NextResponse.json<ApiResponse<typeof prepared>>({ success: true, data: prepared }, { status: 201 });
}
