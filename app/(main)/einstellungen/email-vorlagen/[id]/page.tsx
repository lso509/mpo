import { redirect } from "next/navigation";

export default async function EmailVorlageDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/kommunikation/email-vorlagen/${id}`);
}
