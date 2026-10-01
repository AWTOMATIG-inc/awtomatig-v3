import Header from "./components/layout/header/Header";
import HeroSection from "./components/sections/home/hero/HeroSection";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <HeroSection />
      </main>
    </>
  );
}
