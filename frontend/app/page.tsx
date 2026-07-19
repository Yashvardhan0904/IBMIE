"use client";

import { useEffect, useState } from "react";
import LandingPage from "@/components/landing/LandingPage";
import HomeLoader from "@/components/loader/HomeLoader";

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // Adjust duration

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <HomeLoader />;
  }

  return <LandingPage />;
}