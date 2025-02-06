"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/header';
import Image from 'next/image';

const Page = () => {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="relative flex-grow w-full">
        <Image
          src="/dashboard.png"
          alt="dashboard"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default Page;
