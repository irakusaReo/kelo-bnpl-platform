
import AuthLayout from '../layout'
import MerchantRegisterForm from '@/components/forms/MerchantRegisterForm'

export default function MerchantRegisterPage() {
  return (
    <AuthLayout
      title="Merchant Registration"
      description="Create your merchant account to start selling on Kelo"
    >
      <MerchantRegisterForm />
    </AuthLayout>
  )
}
