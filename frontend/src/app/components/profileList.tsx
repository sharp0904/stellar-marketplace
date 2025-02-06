import React, { useState, useRef } from 'react'
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from 'next/navigation';

const ProfileList = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const moveToProfile = () => {
    router.push("/account/profile")
  }

  const handleConnect = () => {
    router.push("/account/walletConnect")
  };

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsHovered(true);
    }, 200); 
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 200); 
  }

  React.useEffect(() => {
    if (isHovered) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [isHovered]);

  return (
    <div
      className="relative cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar */}
      <FontAwesomeIcon 
        icon={faUser} 
        className="text-white text-4xl p-2" 
      />
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 shadow-md rounded-lg border z-50 dark:border-gray-700 transition-all duration-300 ease-in-out">
          
          <ul>
            <li
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={moveToProfile}
            >
              Profile
            </li>
            <li
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={handleConnect}
            >
              Wallet Connect
            </li>
            <li
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default ProfileList;
