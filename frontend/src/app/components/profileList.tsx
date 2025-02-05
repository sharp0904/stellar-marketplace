import React, { useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { useRouter } from 'next/navigation';

const ProfileList = () => {
  const router = useRouter();
  const moveToProfile = () => {
    router.push("/account/profile")
  }
  const handleConnect = () => {
    router.push("/account/walletConnect")
  };
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
      <FontAwesomeIcon icon={faUser} className="text-white text-2xl" />
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 shadow-md rounded-lg border z-50 dark:border-gray-700">
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
          </ul>
        </div>
      )}
    </div>
  )
}

export default ProfileList;
