import React from 'react'

function AuthLayout({children}) {
  return (
    <div className='flex justify-center py-20'>{children}</div>
  )
}

export default AuthLayout