import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../../api/services';
import toast from 'react-hot-toast';

interface PublicVendorData {
  vendor: {
    id: string;
    business_name: string;
    business_email?: string;
    business_phone?: string;
    gst_number?: string;
    status: string;
    verified: boolean;
  };
  shop: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    banner_url?: string;
    gallery: string[];
    address: string;
    city: string;
    state: string;
    postal_code: string;
    contact_phone: string;
    contact_email: string;
  } | null;
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    discount_percentage: number;
    discounted_price: number;
    category_name: string;
    images: string[];
    status: string;
    stock: number;
  }>;
}

const PublicVendorPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [data, setData] = useState<PublicVendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setError('Vendor ID is required');
      setLoading(false);
      return;
    }

    const fetchVendorData = async () => {
      try {
        setLoading(true);
        const response = await publicApi.getVendorPublicProfile(vendorId);
        setData(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load vendor profile');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: 18,
        color: '#666'
      }}>
        Loading vendor profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        padding: 20
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <div style={{ marginBottom: 8 }}>Vendor Profile Not Found</div>
        <div style={{ fontSize: 14, marginBottom: 24 }}>{error}</div>
        <Link 
          to="/" 
          style={{ 
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 6,
            fontSize: 14
          }}
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  const { vendor, shop, products } = data;
  const activeProducts = products.filter(p => p.status === 'ACTIVE');

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Banner Section */}
      {shop?.banner_url && (
        <div style={{ 
          width: '100%', 
          height: '300px', 
          backgroundImage: `url(${shop.banner_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            padding: '40px 20px 20px'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {shop?.logo_url && (
                  <img 
                    src={shop.logo_url} 
                    alt={shop.name}
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '3px solid white'
                    }}
                  />
                )}
                <div style={{ color: 'white' }}>
                  <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>
                    {shop?.name || vendor.business_name}
                  </h1>
                  {shop?.description && (
                    <p style={{ margin: '8px 0 0', fontSize: 16, opacity: 0.9 }}>
                      {shop.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Info Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#666' }}>Business Name</h3>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{vendor.business_name}</p>
            </div>
            {shop?.address && (
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#666' }}>Address</h3>
                <p style={{ margin: 0, fontSize: 16 }}>
                  {shop.address}, {shop.city}, {shop.state} - {shop.postal_code}
                </p>
              </div>
            )}
            {shop?.contact_phone && (
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#666' }}>Contact</h3>
                <p style={{ margin: 0, fontSize: 16 }}>
                  📞 {shop.contact_phone}
                  {shop?.contact_email && <><br />📧 {shop.contact_email}</>}
                </p>
              </div>
            )}
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#666' }}>Status</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: vendor.verified ? '#28a745' : '#ffc107',
                  color: 'white'
                }}>
                  {vendor.verified ? '✓ Verified' : 'Pending'}
                </span>
                <span style={{ fontSize: 14, color: '#666' }}>
                  {activeProducts.length} Active Products
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        {shop?.gallery && shop.gallery.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 700 }}>Shop Gallery</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {shop.gallery.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Gallery image ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div>
          <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700 }}>
            Products ({activeProducts.length})
          </h2>
          
          {activeProducts.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#666' }}>No Products Available</h3>
              <p style={{ margin: 0, color: '#999' }}>This vendor hasn't added any products yet.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {activeProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Product Image */}
                  <div style={{ 
                    height: '200px', 
                    background: product.images[0] ? `url(${product.images[0]}) center/cover` : '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    color: '#dee2e6'
                  }}>
                    {!product.images[0] && '📦'}
                  </div>
                  
                  {/* Product Info */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ 
                      margin: '0 0 8px', 
                      fontSize: 16, 
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {product.name}
                    </h3>
                    
                    {product.category_name && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#666', 
                        marginBottom: '8px',
                        background: '#f8f9fa',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {product.category_name}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        {product.discount_percentage > 0 ? (
                          <div>
                            <span style={{ 
                              fontSize: 14, 
                              color: '#dc3545', 
                              fontWeight: 600,
                              marginRight: '8px'
                            }}>
                              Rs {product.discounted_price.toLocaleString()}
                            </span>
                            <span style={{ 
                              fontSize: 12, 
                              color: '#999', 
                              textDecoration: 'line-through'
                            }}>
                              Rs {product.price.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 16, fontWeight: 600, color: '#28a745' }}>
                            Rs {product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      {product.stock > 0 && (
                        <span style={{ 
                          fontSize: 12, 
                          color: '#28a745',
                          background: '#d4edda',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          In Stock: {product.stock}
                        </span>
                      )}
                    </div>
                    
                    {product.discount_percentage > 0 && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#dc3545', 
                        fontWeight: 600,
                        marginTop: '4px'
                      }}>
                        {product.discount_percentage}% OFF
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicVendorPage;
