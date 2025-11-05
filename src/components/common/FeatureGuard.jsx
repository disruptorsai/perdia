import React, { useState } from 'react';
import { useFeaturePermission } from '../contexts/FeaturePermissionContext';
import FeatureAccessModal from './FeatureAccessModal';

export default function FeatureGuard({ 
  featureKey, 
  featureName, 
  children, 
  fallback = null 
}) {
  const { hasFeatureAccess } = useFeaturePermission();
  const [showAccessModal, setShowAccessModal] = useState(false);
  
  const hasAccess = hasFeatureAccess(featureKey);
  
  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <>
        <div 
          className="cursor-pointer" 
          onClick={() => setShowAccessModal(true)}
        >
          {children}
        </div>
        <FeatureAccessModal
          isOpen={showAccessModal}
          onClose={() => setShowAccessModal(false)}
          featureName={featureName}
        />
      </>
    );
  }
  
  return children;
}