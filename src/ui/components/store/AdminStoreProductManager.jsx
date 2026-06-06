import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import supabase from '../../../helper/supabaseClient';
import { Table } from '../Table';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { IconButton } from '../IconButton';
import { DropdownMenu } from '../DropdownMenu';
import { Loader } from '../Loader';
import * as SubframeCore from '@subframe/core';
import toast from 'react-hot-toast';
import { STORE_IMAGES_BUCKET } from '../../../helper/storeUtils';

const emptyDraft = () => ({
  name: '',
  price: '',
  description_en: '',
  description_ar: '',
  //sort_order: '0',
  image_url: '',
});

const ProductFormFields = ({ draft, setDraft, imageFile, setImageFile, t }) => (
  <div className="flex flex-col gap-3 w-full">
    <input
      className="h-9 rounded-md border border-neutral-border px-3 text-body w-full"
      placeholder={t('store.admin.namePlaceholder')}
      value={draft.name}
      onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
    />
    <input
      className="h-9 rounded-md border border-neutral-border px-3 text-body w-full"
      placeholder={t('store.admin.descEnPlaceholder')}
      value={draft.description_en}
      onChange={(e) =>
        setDraft((p) => ({ ...p, description_en: e.target.value }))
      }
    />
    <input
      className="h-9 rounded-md border border-neutral-border px-3 text-body w-full"
      placeholder={t('store.admin.descArPlaceholder')}
      value={draft.description_ar}
      onChange={(e) =>
        setDraft((p) => ({ ...p, description_ar: e.target.value }))
      }
      dir="rtl"
    />
    <div className="flex flex-wrap gap-2">
      <input
        type="number"
        min={0}
        step="0.01"
        className="h-9 w-28 rounded-md border border-neutral-border px-3 text-body"
        placeholder={t('store.admin.pricePlaceholder')}
        value={draft.price}
        onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
      />
      {/*
                  <input
        type="number"
        className="h-9 w-24 rounded-md border border-neutral-border px-3 text-body"
        placeholder={t('store.admin.sortPlaceholder')}
        value={draft.sort_order}
        onChange={(e) =>
          setDraft((p) => ({ ...p, sort_order: e.target.value }))
        }
      />
      */}

      <input
        type="file"
        accept="image/*"
        className="text-caption"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
    </div>
    {(draft.image_url || imageFile) && (
      <p className="text-caption text-subtext-color">
        {imageFile ? imageFile.name : t('store.admin.currentImage')}
      </p>
    )}
  </div>
);

export default function AdminStoreProductManager() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState(emptyDraft());
  const [newImageFile, setNewImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft());
  const [editImageFile, setEditImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      //.order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error) setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const uploadImage = async (file) => {
    if (!file) return null;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORE_IMAGES_BUCKET)
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(STORE_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const parsePrice = (value) => {
    const n = parseFloat(String(value).trim());
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const handleAdd = async () => {
    if (!newItem.name.trim()) {
      toast.error(t('store.admin.errors.nameRequired'));
      return;
    }

    setSaving(true);
    try {
      let imageUrl = newItem.image_url || null;
      if (newImageFile) {
        imageUrl = await uploadImage(newImageFile);
      }

      const { error } = await supabase.from('store_products').insert({
        name: newItem.name.trim(),
        description_en: newItem.description_en.trim() || null,
        description_ar: newItem.description_ar.trim() || null,
        price: parsePrice(newItem.price),
        image_url: imageUrl,
        //sort_order: parseInt(newItem.sort_order, 10) || 0,
        is_active: true,
      });

      if (error) throw error;

      toast.success(t('store.admin.productAdded'));
      setIsAdding(false);
      setNewItem(emptyDraft());
      setNewImageFile(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(t('store.admin.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft({
      name: item.name || '',
      price: String(item.price ?? ''),
      description_en: item.description_en || '',
      description_ar: item.description_ar || '',
      //sort_order: String(item.sort_order ?? 0),
      image_url: item.image_url || '',
    });
    setEditImageFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(emptyDraft());
    setEditImageFile(null);
  };

  const saveEdit = async (id) => {
    if (!editDraft.name.trim()) {
      toast.error(t('store.admin.errors.nameRequired'));
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editDraft.image_url || null;
      if (editImageFile) {
        imageUrl = await uploadImage(editImageFile);
      }

      const { error } = await supabase
        .from('store_products')
        .update({
          name: editDraft.name.trim(),
          description_en: editDraft.description_en.trim() || null,
          description_ar: editDraft.description_ar.trim() || null,
          price: parsePrice(editDraft.price),
          image_url: imageUrl,
          //sort_order: parseInt(editDraft.sort_order, 10) || 0,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(t('store.admin.productUpdated'));
      cancelEdit();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(t('store.admin.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (id, nextActive) => {
    const { error } = await supabase
      .from('store_products')
      .update({ is_active: nextActive })
      .eq('id', id);

    if (error) {
      toast.error(t('store.admin.errors.saveFailed'));
      return;
    }
    fetchProducts();
  };

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <span className="text-heading-3 font-heading-3 text-default-font block">
            {t('store.admin.productsTitle')}
          </span>
          <span className="text-body font-body text-subtext-color">
            {t('store.admin.productsSubtitle')}
          </span>
        </div>
        {!isAdding && (
          <Button className="w-auto" onClick={() => setIsAdding(true)}>
            {t('store.admin.addProduct')}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="w-full rounded-md border border-neutral-border p-4 flex flex-col gap-3">
          <ProductFormFields
            draft={newItem}
            setDraft={setNewItem}
            imageFile={newImageFile}
            setImageFile={setNewImageFile}
            t={t}
          />
          <div className="flex gap-2">
            <Button
              variant="neutral-secondary"
              onClick={() => {
                setIsAdding(false);
                setNewItem(emptyDraft());
                setNewImageFile(null);
              }}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdd} loading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex w-full min-h-[120px] justify-center items-center">
          <Loader size="medium" />
        </div>
      ) : (
        <Table
          header={
            <Table.HeaderRow>
              <Table.HeaderCell>{t('store.admin.colImage')}</Table.HeaderCell>
              <Table.HeaderCell>{t('store.admin.colName')}</Table.HeaderCell>
              <Table.HeaderCell>{t('store.admin.colPrice')}</Table.HeaderCell>
              {/*<Table.HeaderCell>{t('store.admin.colSort')}</Table.HeaderCell>*/}
              <Table.HeaderCell>{t('store.admin.colStatus')}</Table.HeaderCell>
              <Table.HeaderCell>{t('common.actions')}</Table.HeaderCell>
            </Table.HeaderRow>
          }
        >
          {products.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <div className="text-center py-6 text-subtext-color">
                  {t('store.admin.noProducts')}
                </div>
              </Table.Cell>
            </Table.Row>
          ) : (
            products.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    '—'
                  )}
                </Table.Cell>
                <Table.Cell>
                  {editingId === item.id ? (
                    <ProductFormFields
                      draft={editDraft}
                      setDraft={setEditDraft}
                      imageFile={editImageFile}
                      setImageFile={setEditImageFile}
                      t={t}
                    />
                  ) : (
                    <span className="text-body-bold font-body-bold">
                      {item.name}
                    </span>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {editingId === item.id ? null : (
                    <>${parseFloat(item.price).toFixed(2)}</>
                  )}
                </Table.Cell>
                {/* <Table.Cell>
                  {editingId === item.id ? null : item.sort_order}
                </Table.Cell>*/}
                <Table.Cell>
                  <Badge variant={item.is_active ? 'success' : 'neutral'}>
                    {item.is_active
                      ? t('store.admin.active')
                      : t('store.admin.inactive')}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {editingId === item.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        onClick={() => saveEdit(item.id)}
                        loading={saving}
                      >
                        {t('common.save')}
                      </Button>
                      <Button
                        size="small"
                        variant="neutral-secondary"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton icon={<SubframeCore.FeatherSquarePen />} />
                      </SubframeCore.DropdownMenu.Trigger>
                      <SubframeCore.DropdownMenu.Portal>
                        <SubframeCore.DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={8}
                          asChild={true}
                        >
                          <DropdownMenu>
                            <DropdownMenu.DropdownItem
                              icon={<SubframeCore.FeatherPen />}
                              onClick={() => startEdit(item)}
                            >
                              {t('common.edit')}
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem
                              onClick={() =>
                                setActive(item.id, !item.is_active)
                              }
                            >
                              {item.is_active
                                ? t('store.admin.deactivate')
                                : t('store.admin.activate')}
                            </DropdownMenu.DropdownItem>
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  )}
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
