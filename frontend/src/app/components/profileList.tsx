import React from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { useState, useEffect } from "react";
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
        <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-lg border z-50">
          <ul>
            <li className="p-2 hover:bg-gray-100 cursor-pointer" onClick={moveToProfile}>Profile</li>
            <li className="p-2 hover:bg-gray-100 cursor-pointer" onClick={handleConnect}>Wallet Connect</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default ProfileList