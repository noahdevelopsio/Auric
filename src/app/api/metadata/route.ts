import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateName, validateDescription, validateAttributes } from "@/lib/utils/validation";
import { buildNftMetadata, type BuiltNftMetadata } from "@/lib/metadata/build";
import { SUPABASE_BUCKETS } from "@/lib/utils/constants";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse, MetadataResponse } from "@/types/api";
import type { NFTAttribute } from "@/types/nft";

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "metadata");
  if (limited) return limited;

  let body: {
    name?: string;
    description?: string;
    image?: string;
    externalUrl?: string;
    attributes?: NFTAttribute[];
    contentType?: string;
    sellerFeeBasisPoints?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description, image, externalUrl, attributes, contentType, sellerFeeBasisPoints } = body;

  if (!name) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "name is required" }, { status: 400 });
  }
  const nameError = validateName(name);
  if (nameError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: nameError }, { status: 400 });
  }

  if (description) {
    const descError = validateDescription(description);
    if (descError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: descError }, { status: 400 });
    }
  }

  if (!image) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "image is required" }, { status: 400 });
  }

  if (attributes && attributes.length > 0) {
    const attrError = validateAttributes(attributes);
    if (attrError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: attrError }, { status: 400 });
    }
  }

  const metadata = buildNftMetadata({ name, description, image, externalUrl, attributes, contentType, sellerFeeBasisPoints });

  const supabase = getSupabaseAdmin();
  const fileName = `${randomUUID()}.json`;
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKETS.METADATA)
    .upload(fileName, JSON.stringify(metadata), { contentType: "application/json", upsert: false });

  if (uploadError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKETS.METADATA).getPublicUrl(fileName);

  return NextResponse.json<ApiResponse<MetadataResponse & { metadata: BuiltNftMetadata }>>(
    { success: true, data: { metadata_url: publicUrlData.publicUrl, metadata } },
    { status: 201 }
  );
}
