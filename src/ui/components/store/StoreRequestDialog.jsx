import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherShoppingCart } from '@subframe/core';
import DialogWrapper from '../DialogWrapper';
import { Button } from '../Button';
import { TextField } from '../TextField';
import supabase from '../../../helper/supabaseClient';
import {
  getStoreProductDescription,
} from '../../../helper/storeUtils';
import toast from 'react-hot-toast';

const StoreRequestDialog = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, product?.id]);

  if (!product) return null;

  const unitPrice = parseFloat(product.price);
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const totalPrice = unitPrice * qty;
  const description = getStoreProductDescription(product, i18n.language);

  const handleSubmit = async () => {
    if (qty < 1) return;

    setIsSubmitting(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error('Not authenticated');

      const { error } = await supabase.from('store_requests').insert({
        doctor_id: user.id,
        product_id: product.id,
        quantity: qty,
        product_name: product.name,
        product_description: description || null,
        unit_price: unitPrice,
        total_price: totalPrice,
        notes: notes.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success(t('store.request.success'));
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t('store.request.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={t('store.request.title')}
      description={product.name}
      icon={<FeatherShoppingCart />}
      loading={isSubmitting}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-2 w-full">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-40 object-cover rounded-md border border-neutral-border"
          />
        )}

        {description && (
          <p className="text-body font-body text-subtext-color">{description}</p>
        )}

        <div className="flex items-center justify-between text-body">
          <span className="text-subtext-color">{t('store.unitPrice')}</span>
          <span className="font-body-bold text-default-font">
            ${unitPrice.toFixed(2)}
          </span>
        </div>

        <TextField label={t('store.request.quantityLabel')}>
          <TextField.Input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </TextField>

        <div className="flex flex-col gap-2">
          <label className="text-body-bold font-body-bold text-default-font">
            {t('store.request.notesLabel')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('store.request.notesPlaceholder')}
            rows={2}
            className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          />
        </div>

        <div className="flex items-center justify-between rounded-md bg-neutral-50 border border-neutral-border p-4">
          <span className="text-body-bold font-body-bold">{t('store.request.total')}</span>
          <span className="text-heading-3 font-heading-3 text-default-font">
            ${totalPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-neutral-border">
          <Button
            variant="neutral-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {t('store.request.submit')}
          </Button>
        </div>
      </div>
    </DialogWrapper>
  );
};

export default StoreRequestDialog;
