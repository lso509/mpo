import { redirect } from "next/navigation";

export default async function KommunikationEmailVorlageDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/einstellungen/email-vorlagen/${id}`);
}
