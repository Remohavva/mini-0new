interface Props {
  status?: string;
  size?: "sm" | "md";
}

export default function VerificationBadge({ status, size = "md" }: Props) {
  if (status === "verified") {
    return (
      <span className={`inline-flex items-center gap-1 bg-blue-100 text-blue-700 font-semibold rounded-full ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}`}>
        ✅ Verified Rider
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className={`inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 font-semibold rounded-full ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}`}>
        ⏳ Verification Pending
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className={`inline-flex items-center gap-1 bg-red-100 text-red-700 font-semibold rounded-full ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}`}>
        ❌ Verification Rejected
      </span>
    );
  }
  return null;
}
