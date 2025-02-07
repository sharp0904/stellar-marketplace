import React from 'react'
import Image from 'next/image'

const Footer = () => {
  return (
    <div className='w-full h-full'>
      <Image
        src="/footer.png"
        alt="Footer"
        width={4000}
        height={1000}
        className='w-full'
      />
    </div>
  )
}

export default Footer