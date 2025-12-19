import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../../helper/supabaseClient';
import { Table } from './Table';
import { Button } from './Button';
import { Badge } from './Badge';
import { IconButton } from './IconButton';
import { DropdownMenu } from './DropdownMenu';
import * as SubframeCore from '@subframe/core';

export default function AdminOptionManager({ type, label }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  // 1. Updated newItem state
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    description_en: '',
    description_ar: '',
  });

  const [editingId, setEditingId] = useState(null);
  // 2. Updated editDraft state
  const [editDraft, setEditDraft] = useState({
    name: '',
    price: '',
    description_en: '',
    description_ar: '',
  });

  const nameHeader = useMemo(() => {
    if (type === 'printing_method') return 'Method Name';
    if (type === 'aligners_material') return 'System Name';
    if (type === 'acceptance_fee') return 'Fee Name';
    return 'Name';
  }, [type]);

  const addButtonText = useMemo(() => {
    if (type === 'printing_method') return 'Add Method';
    if (type === 'aligners_material') return 'Add System';
    if (type === 'acceptance_fee') return 'Add Fee';
    return 'Add Item';
  }, [type]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: true });

    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [type]);

  const handleAdd = async () => {
    if (!newItem.name) return;
    const priceNumber = parseFloat(String(newItem.price).trim() || '0');

    // 3. Included description in Insert
    await supabase.from('services').insert([
      {
        type,
        name: newItem.name,
        description_en: newItem.description_en,
        description_ar: newItem.description_ar,
        price: isNaN(priceNumber) ? 0 : priceNumber,
        is_active: true,
      },
    ]);

    setNewItem({ name: '', price: '', description_en: '', description_ar: '' });
    setIsAdding(false);
    fetchItems();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    // 4. Map description to draft
    setEditDraft({
      name: item.name || '',
      price: item.price ?? '',
      description_en: item.description_en || '',
      description_ar: item.description_ar || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      name: '',
      price: '',
      description_en: '',
      description_ar: '',
    });
  };

  const saveEdit = async (id) => {
    const priceNumber = parseFloat(String(editDraft.price).trim());

    // 5. Included description in Update
    await supabase
      .from('services')
      .update({
        name: editDraft.name,
        description_en: editDraft.description_en,
        description_ar: editDraft.description_ar,
        price: isNaN(priceNumber) ? 0 : priceNumber,
      })
      .eq('id', id);

    cancelEdit();
    fetchItems();
  };

  const setActive = async (id, nextActive) => {
    await supabase
      .from('services')
      .update({ is_active: nextActive })
      .eq('id', id);

    fetchItems();
  };

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full items-center justify-between">
        <span className="text-heading-3 font-heading-3 text-default-font">
          {label}
        </span>
        {!isAdding ? (
          <Button className="w-auto" onClick={() => setIsAdding(true)}>
            {addButtonText}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              className="h-8 rounded-md border border-neutral-border px-3 text-body"
              placeholder={nameHeader.replace(' Name', '')}
              value={newItem.name}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, name: e.target.value }))
              }
            />
            {/* Added Description Input for New Item */}
            <input
              className="h-8 rounded-md border border-neutral-border px-3 text-body"
              placeholder="English Description"
              value={newItem.description_en}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, description_en: e.target.value }))
              }
            />
            <input
              className="h-8 rounded-md border border-neutral-border px-3 text-body"
              placeholder="Arabic Description"
              value={newItem.description_ar}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, description_ar: e.target.value }))
              }
              dir="rtl"
            />
            <input
              type="number"
              className="h-8 w-28 rounded-md border border-neutral-border px-3 text-body"
              placeholder="Price"
              value={newItem.price}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, price: e.target.value }))
              }
            />
            <Button
              variant="neutral-secondary"
              onClick={() => {
                setIsAdding(false);
                setNewItem({
                  name: '',
                  price: '',
                  description_en: '',
                  description_ar: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd}>Save</Button>
          </div>
        )}
      </div>

      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>{nameHeader}</Table.HeaderCell>
            <Table.HeaderCell>English Description</Table.HeaderCell>
            <Table.HeaderCell>Arabic Description</Table.HeaderCell>
            <Table.HeaderCell>Price</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.HeaderRow>
        }
      >
        {(items || []).map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>
              {editingId === item.id ? (
                <input
                  className="h-10 w-full rounded-md border border-neutral-border px-3 text-body"
                  value={editDraft.name}
                  onChange={(e) =>
                    setEditDraft((p) => ({ ...p, name: e.target.value }))
                  }
                />
              ) : (
                <span className="text-body-bold font-body-bold text-neutral-700 text-wrap">
                  {item.name}
                </span>
              )}
            </Table.Cell>

            {/* English Description Cell */}
            <Table.Cell>
              {editingId === item.id ? (
                <input
                  className="h-10 w-full rounded-md border border-neutral-border px-3 text-body"
                  placeholder="English description"
                  value={editDraft.description_en}
                  onChange={(e) =>
                    setEditDraft((p) => ({
                      ...p,
                      description_en: e.target.value,
                    }))
                  }
                />
              ) : (
                <span
                  className="text-body font-body text-neutral-500 text-wrap line-clamp-2"
                  title={item.description_en}
                >
                  {item.description_en || '-'}
                </span>
              )}
            </Table.Cell>

            {/* Arabic Description Cell */}
            <Table.Cell>
              {editingId === item.id ? (
                <input
                  className="h-10 w-full rounded-md border border-neutral-border px-3 text-body"
                  placeholder="وصف عربي"
                  value={editDraft.description_ar}
                  onChange={(e) =>
                    setEditDraft((p) => ({
                      ...p,
                      description_ar: e.target.value,
                    }))
                  }
                  dir="rtl"
                />
              ) : (
                <span
                  className="text-body font-body text-neutral-500 text-wrap line-clamp-2"
                  title={item.description_ar}
                  dir="rtl"
                >
                  {item.description_ar || '-'}
                </span>
              )}
            </Table.Cell>

            <Table.Cell>
              {editingId === item.id ? (
                <input
                  type="number"
                  className="h-10 w-28 rounded-md border border-neutral-border px-3 text-body"
                  value={editDraft.price}
                  onChange={(e) =>
                    setEditDraft((p) => ({ ...p, price: e.target.value }))
                  }
                />
              ) : (
                <span className="text-body font-body text-neutral-500">
                  ${Number(item.price || 0).toFixed(2)}
                </span>
              )}
            </Table.Cell>
            <Table.Cell>
              <Badge variant={item.is_active ? 'success' : 'neutral'}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <div className="flex grow shrink-0 basis-0 items-center justify-end">
                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <Button size="small" onClick={() => saveEdit(item.id)}>
                      Save
                    </Button>
                    <Button
                      size="small"
                      variant="neutral-secondary"
                      onClick={cancelEdit}
                    >
                      Cancel
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
                            onClick={() => startEdit(item)}
                            icon={<SubframeCore.FeatherPen />}
                          >
                            Edit
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem
                            onClick={() => setActive(item.id, !item.is_active)}
                          >
                            {item.is_active ? 'Archive' : 'Activate'}
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                )}
              </div>
            </Table.Cell>
          </Table.Row>
        ))}

        {!loading && items.length === 0 ? (
          <Table.Row>
            <Table.Cell className="col-span-6">
              <span className="text-body font-body text-neutral-500">
                No records yet.
              </span>
            </Table.Cell>
          </Table.Row>
        ) : null}
      </Table>
    </div>
  );
}
