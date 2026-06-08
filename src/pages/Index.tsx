import { Hero } from "@/components/Hero";
import { Mission } from "@/components/Mission";
import { Features } from "@/components/Features";
import { Community } from "@/components/Community";
import { GetStarted } from "@/components/GetStarted";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <div className="fixed right-4 top-4 z-50 max-w-sm rounded-md bg-red-600 px-4 py-3 text-sm font-semibold leading-snug text-white shadow-lg sm:right-6 sm:top-6">
        Hi! 👋 This is draft website to give an idea of what we are working
        towards -
        please{" "}
        <a
          href="https://github.com/mlcast-community/mlcast-website"
          className="underline underline-offset-2 hover:text-red-100"
        >
          raise an issue/make a PR
        </a>{" "}
        with any suggestions you have ❤️⭐
      </div>
      <Hero />
      <Mission />
      <Features />
      <Community />
      <GetStarted />
      <Footer />
    </main>
  );
};

export default Index;
