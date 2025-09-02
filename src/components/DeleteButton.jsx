'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DeleteButton({ 
  itemId, 
  itemName, 
  onDelete, 
  isAdmin = false,
  className = "",
  variant = "destructive",
  size = "sm"
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isAdmin) {
      toast.error('Access denied: Admin privileges required');
      return;
    }

    // Show confirmation toast with action buttons
    const confirmed = await new Promise((resolve) => {
      toast(
        <div className="flex flex-col space-y-3">
          <div className="font-medium">Delete {itemName}?</div>
          <div className="text-sm text-gray-600">This action cannot be undone.</div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss();
                resolve(false);
              }}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss();
                resolve(true);
              }}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>,
        {
          duration: Infinity, // Keep until user makes a choice
          position: 'top-center',
        }
      );
    });

    if (!confirmed) {
      return; // Just return without showing any message
    }

    setIsDeleting(true);
    try {
      await onDelete(itemId);
      toast.success(`${itemName} deleted successfully`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete ${itemName}: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return null; // Don't render the button for non-admin users
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDelete}
      disabled={isDeleting}
      className={className}
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
