import React from 'react'

const MainLayout = ({children}) => {
  return (
    <div className='container mx-auto my-30'>
      {children}
    </div>
  )
}

export default MainLayout;