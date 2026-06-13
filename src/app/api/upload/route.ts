import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateFileType, validateFileSize } from "@/lib/utils/validation";
import { SUPABASE_BUCKETS } from "@/lib/utils/constants";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse, UploadResponse } from "@/types/api";
import type { ChainType } from "@/types/nft";

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "upload");
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const chain = formData.get("chain");

  if (!(file instanceof File)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "file is required" }, { status: 400 });
  }

  if (chain !== "solana" && chain !== "bitcoin") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "chain must be 'solana' or 'bitcoin'" },
      { status: 400 }
    );
  }

  const typeError = validateFileType(file, chain as ChainType);
  if (typeError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: typeError }, { status: 400 });
  }

  const sizeError = validateFileSize(file, chain as ChainType);
  if (sizeError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: sizeError }, { status: 400 });
  }

  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const fileName = `${randomUUID()}${extension}`;

  const supabase = getSupabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKETS.MEDIA)
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKETS.MEDIA).getPublicUrl(fileName);

  return NextResponse.json<ApiResponse<UploadResponse>>(
    { success: true, data: { url: publicUrlData.publicUrl } },
    { status: 201 }
  );
}
