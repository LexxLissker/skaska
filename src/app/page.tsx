import { Storefront } from "@/components/storefront";
import { getCatalog } from "@/lib/vendure";

export default async function Home() {
  const catalog = await getCatalog();
  return <Storefront catalog={catalog} />;
}
