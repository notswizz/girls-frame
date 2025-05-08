import { Metadata } from "next";
import HotOrNot from '~/components/HotOrNot';
import { APP_OG_IMAGE_URL } from "~/lib/constants";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Hot or Not",
    description: "Who's hotter? You decide!",
    openGraph: {
      title: "Hot or Not",
      description: "Who's hotter? You decide!",
      images: [APP_OG_IMAGE_URL],
    },
  };
}

export default function Home() {
  return <HotOrNot />;
}
