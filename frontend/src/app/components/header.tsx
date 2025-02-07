import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import Profile from "@/app/components/profileList";
import Link from 'next/link';

const Header = () => {
  const { roles, token } = useAuth();
  const router = useRouter();

  const moveToDash = () => {
    router.push("/")
  }

  return (
    <>
      <div className="h-25 bg-[#1B1AFF] fixed w-full top-0 z-50">
        <nav className="py-2 md:py-4">
          <div className="container px-4 mx-auto md:flex md:items-center">
            <div className="flex justify-between items-center">
              <Image
                src="/logo.webp"
                alt="Logo"
                width={210}
                height={80}
                onClick={moveToDash}
                className='cursor-pointer'
              />
            </div>
            {!token ? (
              <div className="hidden md:flex flex-col md:flex-row md:ml-auto mt-3 md:mt-0" id="navbar-collapse">
                <Link href="/login" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-green-500 rounded hover:bg-gray-100 hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">Login</Link>
                {/* <a href="/register" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-green-500 rounded hover:bg-gray-100 hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">Signup</a> */}
              </div>
            ) : (
              roles.includes("client") ? (
                <>
                  <div className="hidden md:flex flex-col items-center md:flex-row md:ml-auto mt-3 md:mt-0" id="navbar-collapse">
                    <div className='mr-5'>
                      <Link href="/dashboard/client" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-green-500 rounded hover:bg-gray-100 hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">New Job</Link>
                      <Link href="/dashboard/client/jobList" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-green-500 rounded hover:bg-gray-100 hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">My Jobs</Link>
                    </div>
                    <Profile />
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden md:flex flex-col items-center md:flex-row md:ml-auto mt-3 md:mt-0" id="navbar-collapse">
                    <div className='mr-5'>
                      <Link href="/dashboard/developer" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-green-500 rounded hover:bg-gray-100 hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">All Jobs</Link>
                    </div>
                    <div className='mr-5'>
                      <Link href="/dashboard/developer/appliedJob" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-green-500 rounded hover:bg-gray-100 hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">My Jobs</Link>
                    </div>
                    <Profile />
                  </div>
                </>
              )
            )}
          </div>
        </nav>
      </div>
      <div className='h-[106px]'></div>
    </>
  )
}

export default Header