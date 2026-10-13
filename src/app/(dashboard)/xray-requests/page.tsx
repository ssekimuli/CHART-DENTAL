import { redirect } from "next/navigation";

export default function XrayRequestsRedirect() {
  redirect("/radiology-requests");
}
