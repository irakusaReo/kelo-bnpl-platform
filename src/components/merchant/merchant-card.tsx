import React from 'react';
import Link from 'next/link';
import { MerchantStore } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface MerchantCardProps {
  merchant: MerchantStore;
}

const MerchantCard: React.FC<MerchantCardProps> = ({ merchant }) => {
  const isPartner = merchant.integrationType === 'PARTNER';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{merchant.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{merchant.description}</p>
        <p className="mt-2 text-xs font-semibold text-gray-500 uppercase">{merchant.category}</p>
      </CardContent>
      <CardFooter>
        {isPartner ? (
          <a href={merchant.externalUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button className="w-full">Visit Site</Button>
          </a>
        ) : (
          <Link href={`/marketplace?store=${merchant.id}`} className="w-full">
            <Button variant="outline" className="w-full">Shop on Kelo</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default MerchantCard;
