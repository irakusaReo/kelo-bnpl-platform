
'use client'

import { useState } from 'react'
import AuthLayout from '../layout'
import LoginForm from '@/components/forms/LoginForm'
import RegisterForm from '@/components/forms/RegisterForm'

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true)

  const toggleView = () => setShowLogin(!showLogin)

  return (
    <AuthLayout
      title={showLogin ? 'Welcome Back' : 'Create an Account'}
      description={
        showLogin
          ? 'Enter your credentials to access your account'
          : 'Fill out the form to get started with Kelo'
      }
    >
      {showLogin ? (
        <LoginForm onSwitchToRegister={toggleView} />
      ) : (
        <RegisterForm onSwitchToLogin={toggleView} />
      )}
    </AuthLayout>
  )
}
