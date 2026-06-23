import type { Metadata } from "next";
import CityPage from "@/components/CityPage";
import { getCity } from "@/lib/cities";

const city = getCity("amsterdam")!;

export const metadata: Metadata = {
  title: city.title,
  description: city.description,
};

export default function Page() {
  return <CityPage city={city} />;
}
