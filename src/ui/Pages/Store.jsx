import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import supabase from '../../helper/supabaseClient';
import Headline from '../components/Headline';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Table } from '../components/Table';
import StoreRequestDialog from '../components/store/StoreRequestDialog';
import { getStoreProductDescription } from '../../helper/storeUtils';

function Store() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, requestsRes] = await Promise.all([
        supabase
          .from('store_products')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('store_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setProducts(productsRes.data || []);
      setMyRequests(requestsRes.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openRequest = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const statusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
    };
    return (
      <Badge variant={variants[status] || 'neutral'} className="text-xs">
        {t(`store.requestStatus.${status}`)}
      </Badge>
    );
  };

  return (
    <>
      {error && <Error error={error} />}

      <Headline submit={false}>{t('store.title')}</Headline>
      <p className="text-body font-body text-subtext-color -mt-2 mb-6">
        {t('store.subtitle')}
      </p>

      {loading ? (
        <div className="flex w-full min-h-[200px] justify-center items-center">
          <Loader size="medium" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-md border border-neutral-border bg-neutral-50 p-8 text-center text-subtext-color">
          {t('store.noProducts')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {products.map((product) => {
            const description = getStoreProductDescription(
              product,
              i18n.language,
            );
            return (
              <article
                key={product.id}
                className="flex flex-col rounded-lg border border-neutral-border bg-default-background shadow-sm overflow-hidden"
              >
                <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-caption text-subtext-color">
                      {t('store.noImage')}
                    </span>
                  )}
                </div>
                <div className="flex flex-col flex-1 gap-3 p-4">
                  <h3 className="text-body-bold font-body-bold text-default-font">
                    {product.name}
                  </h3>
                  <p className="text-caption font-caption text-subtext-color line-clamp-3 flex-1">
                    {description || t('common.noDescription')}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <span className="text-heading-3 font-heading-3 text-default-font">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <Button size="small" onClick={() => openRequest(product)}>
                      {t('store.requestProduct')}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {myRequests.length > 0 && (
        <div className="flex w-full flex-col gap-4 mt-12">
          <span className="text-heading-2 font-heading-2 text-default-font">
            {t('store.myRequests')}
          </span>
          <div className="w-full overflow-x-auto">
            <Table
              header={
                <Table.HeaderRow>
                  <Table.HeaderCell>
                    {t('store.table.product')}
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    {t('store.table.quantity')}
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    {t('store.table.total')}
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    {t('store.table.status')}
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    {t('store.table.date')}
                  </Table.HeaderCell>
                </Table.HeaderRow>
              }
            >
              {myRequests.map((req) => (
                <Table.Row key={req.id}>
                  <Table.Cell>
                    <span className="text-body-bold font-body-bold">
                      {req.product_name}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{req.quantity}</Table.Cell>
                  <Table.Cell>
                    ${parseFloat(req.total_price).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell>{statusBadge(req.status)}</Table.Cell>
                  <Table.Cell>
                    {new Date(req.created_at).toLocaleDateString()}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table>
          </div>
        </div>
      )}

      <StoreRequestDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={fetchData}
      />
    </>
  );
}

export default Store;
