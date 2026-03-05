import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function EmailVorlagenRedirectPage() {
  redirect("/kommunikation/email-vorlagen");
}
