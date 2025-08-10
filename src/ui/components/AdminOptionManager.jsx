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
  const [newItem, setNewItem] = useState({ name: '', price: '' });

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', price: '' });

  const nameHeader = useMemo(() => {
    if (type === 'printing_method') return 'Method Name';
    if (type === 'aligners_material') return 'Material Name';
    if (type === 'acceptance_fee') return 'Fee Name';
    return 'Name';
  }, [type]);

  const addButtonText = useMemo(() => {
    if (type === 'printing_method') return 'Add Method';
    if (type === 'aligners_material') return 'Add Material';
    if (type === 'acceptance_fee') return 'Add Fee';
    return 'Add Item';
  }, [type]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('type', type)
      //.eq('is_active', true)
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

    await supabase.from('services').insert([
      {
        type,
        name: newItem.name,
        price: isNaN(priceNumber) ? 0 : priceNumber,
        is_active: true,
      },
    ]);

    setNewItem({ name: '', price: '' });
    setIsAdding(false);
    fetchItems();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft({ name: item.name || '', price: item.price ?? '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ name: '', price: '' });
  };

  const saveEdit = async (id) => {
    const priceNumber = parseFloat(String(editDraft.price).trim());

    await supabase
      .from('services')
      .update({
        name: editDraft.name,
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
                setNewItem({ name: '', price: '' });
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
                <span className="text-body-bold font-body-bold text-neutral-700">
                  {item.name}
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
                      <IconButton icon=<SubframeCore.FeatherSquarePen /> />
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
                            icon=<SubframeCore.FeatherPen />
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
            <Table.Cell className="col-span-4">
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

/*
export default function AdminOptionManager({ tableName, label }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', price: '' });

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ label: '', price: '' });

  const nameHeader = useMemo(() => {
    if (tableName === 'printing_methods') return 'Method Name';
    if (tableName === 'aligner_materials') return 'Material Name';
    return 'Name';
  }, [tableName]);

  const addButtonText = useMemo(() => {
    if (tableName === 'printing_methods') return 'Add Method';
    if (tableName === 'aligner_materials') return 'Add Material';
    return 'Add Item';
  }, [tableName]);

  const slugify = (text) =>
    (text || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at');
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  const handleAdd = async () => {
    if (!newItem.label) return;
    const priceNumber = parseFloat(String(newItem.price).trim() || '0');
    await supabase.from(tableName).insert([
      {
        label: newItem.label,
        value: slugify(newItem.label),
        price: isNaN(priceNumber) ? 0 : priceNumber,
        is_active: true,
      },
    ]);
    setNewItem({ label: '', price: '' });
    setIsAdding(false);
    fetchItems();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft({ label: item.label || '', price: item.price ?? '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ label: '', price: '' });
  };

  const saveEdit = async (id) => {
    const priceNumber = parseFloat(String(editDraft.price).trim());
    await supabase
      .from(tableName)
      .update({
        label: editDraft.label,
        price: isNaN(priceNumber) ? 0 : priceNumber,
      })
      .eq('id', id);
    cancelEdit();
    fetchItems();
  };

  const setActive = async (id, nextActive) => {
    await supabase
      .from(tableName)
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
              value={newItem.label}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, label: e.target.value }))
              }
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
                setNewItem({ label: '', price: '' });
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
                  value={editDraft.label}
                  onChange={(e) =>
                    setEditDraft((p) => ({ ...p, label: e.target.value }))
                  }
                />
              ) : (
                <span className="text-body-bold font-body-bold text-neutral-700">
                  {item.label}
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
                      <IconButton />
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
            <Table.Cell className="col-span-4">
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
*/
