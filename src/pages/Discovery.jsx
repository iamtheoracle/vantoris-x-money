import React from 'react';
import { useNavigate } from 'react-router-dom';
import DiscoverFeed from '@/components/vantoris/herobox/DiscoverFeed';

export default function Discovery() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-6 pb-28 sm:px-6">
      <DiscoverFeed
        standalone
        onShop={() => navigate('/herobox')}
        onDonate={() => navigate('/herobox')}
      />
    </div>
  );
}
