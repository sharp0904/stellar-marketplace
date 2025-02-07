import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import Profile from "@/app/components/profileList";

const Header = () => {
  const { user, roles, token } = useAuth();
  const router = useRouter();

  const moveToDash = () => {
    router.push("/")
  }

  return (
    <div className="h-25 bg-[#1B1AFF]">
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
              <a href="/login" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-[#12D465] rounded hover:bg-[#F0F4F8] hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">Login</a>
              {/* <a href="/register" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-[#12D465] rounded hover:bg-[#F0F4F8] hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">Signup</a> */}
            </div>
          ) : (
            roles.includes("client") ? (
              <>
                <div className="hidden md:flex flex-col items-center md:flex-row md:ml-auto mt-3 md:mt-0" id="navbar-collapse">
                  <div className='mr-5'>
                    <a href="#" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-[#12D465] rounded hover:bg-[#F0F4F8] hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">New Job</a>
                    <a href="#" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-[#12D465] rounded hover:bg-[#F0F4F8] hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">My Jobs</a>
                  </div>
                  <Profile />
                </div>
              </>
            ) : (
              <>
                <div className="hidden md:flex flex-col items-center md:flex-row md:ml-auto mt-3 md:mt-0" id="navbar-collapse">
                  <div className='mr-5'>
                    <a href="#" className="p-3 lg:px-8 md:mx-4 text-black text-centerx bg-[#12D465] rounded hover:bg-[#F0F4F8] hover:text-black transition-colors duration-300 mt-1 md:mt-0 md:ml-1">All Jobs</a>
                  </div>
                  <Profile />
                </div>
              </>
            )
          )}
        </div>
      </nav>
    </div>
  )
}

export default Header