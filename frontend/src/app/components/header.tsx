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
    <div className="h-25">
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
              <a href="/login" className="p-2 lg:px-4 md:mx-2 text-green-600 text-center border border-solid border-green-600 rounded hover:bg-green-600 hover:text-white transition-colors duration-300 mt-1 md:mt-0 md:ml-1">Login</a>
              <a href="/register" className="p-2 lg:px-4 md:mx-2 text-green-600 text-center border border-solid border-green-600 rounded hover:bg-green-600 hover:text-white transition-colors duration-300 mt-1 md:mt-0 md:ml-1">Signup</a>
            </div>
          ) : (
            roles.includes("client") ? (
              <>
                <div className="hidden md:flex flex-col items-center md:flex-row md:ml-auto mt-3 md:mt-0" id="navbar-collapse">
                  <div className='mr-5'>
                    <a href="#" className="p-2 lg:px-4 md:mx-2 text-green-600 text-center border border-solid border-green-600 rounded hover:bg-green-600 hover:text-white transition-colors duration-300 mt-1 md:mt-0 md:ml-1">New Job</a>
                    <a href="#" className="p-2 lg:px-4 md:mx-2 text-green-600 text-center border border-solid border-green-600 rounded hover:bg-green-600 hover:text-white transition-colors duration-300 mt-1 md:mt-0 md:ml-1">My Jobs</a>
                  </div>
                  <Profile />
                </div>
              </>
            ) : (
              <>
                <div className="hidden md:flex flex-col items-center md:flex-row md:ml-auto mt-3 md:mt-0" id="navbar-collapse">
                  <div className='mr-5'>
                    <a href="#" className="p-2 lg:px-4 md:mx-2 text-green-600 text-center border border-solid border-green-600 rounded hover:bg-green-600 hover:text-white transition-colors duration-300 mt-1 md:mt-0 md:ml-1">All Jobs</a>
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