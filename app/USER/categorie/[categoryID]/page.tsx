"use client";
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header'; 
import Footer from '../../components/Footer'; 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; 
import './styleCategory.css';
import { useSearchParams, useParams } from 'next/navigation';
import FilterTools from '../../components/FilterTools'; // Thêm FilterTools component

interface Province {
  code: number;
  name: string;
}

interface Material {
  materialID: number;
  material_name?: string;
  price: number;
}

interface Image {
  imageURL: string;
  is_main: number;
}

interface Product {
  productID?: string;
  product_name: string;
  categoryID: number;
  style: string;
  stock: number;
  description: string;
  materials: Material[];
  images: Image[];
}

interface Category {
  categoryID: number;
  category_name: string;
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
  </>
);

export default function CategoryPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const query = searchParams.get('query') || '';
  const categoryID = Number(params.categoryID);

  const [showAd, setShowAd] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]); 
  const [isClient, setIsClient] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryName, setCategoryName] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"; 

  useEffect(() => {
    setIsClient(true);
    // Lấy favouriteProducts từ localStorage chỉ khi client sẵn sàng
    const storedUserInfo = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo);
      const userFavouritesKey = `favouriteProducts_${parsedUserInfo.perID}`;
      const storedFavourites = localStorage.getItem(userFavouritesKey);
      if (storedFavourites) {
        setFavouriteProducts(JSON.parse(storedFavourites));
      } else {
        setFavouriteProducts([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        const userFavouritesKey = `favouriteProducts_${parsedUserInfo.perID}`;
        localStorage.setItem(userFavouritesKey, JSON.stringify(favouriteProducts));
      }
    }
  }, [favouriteProducts, isClient]);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/')
      .then((response) => response.json())
      .then((data: Province[]) => setProvinces(data))
      .catch((error) => console.error('Lỗi khi tải danh sách tỉnh thành:', error));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/materials`)
      .then((response) => response.json())
      .then((response) => {
        const data = response.data || response || [];
        if (Array.isArray(data)) setMaterials(data);
      })
      .catch((error) => console.error('Lỗi khi lấy chất liệu:', error));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then((response) => response.json())
      .then((response) => {
        const data = response.data || response || [];
        if (Array.isArray(data)) {
          setCategories(data);
          const currentCategory = data.find((cat: Category) => cat.categoryID === categoryID);
          if (currentCategory) {
            setCategoryName(currentCategory.category_name);
          }
        }
      })
      .catch((error) => console.error('Lỗi khi lấy danh mục:', error));
  }, [categoryID]);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((response) => response.json())
      .then((response) => {
        const data = response.data || response || [];
        if (Array.isArray(data)) {
          const formattedData = data.map((product: Product) => ({
            ...product,
            images: product.images.map((img: Image) => ({
              ...img,
              imageURL: img.imageURL
                ? img.imageURL.startsWith('/')
                  ? `${API_URL}${img.imageURL}`
                  : img.imageURL
                : '/images/addImage.png',
            })),
          }));
          const filteredByCategory = formattedData.filter((product: Product) => product.categoryID === categoryID);
          setProducts(formattedData);
          setFilteredProducts(filteredByCategory);
        }
      })
      .catch((error) => {
        console.error('Lỗi khi tải danh sách sản phẩm:', error);
        setProducts([]);
        setFilteredProducts([]);
      });
  }, [categoryID]);

  const handleFilter = () => {
    let filtered = [...products].filter((product) => product.categoryID === categoryID);

    if (query) {
      filtered = filtered.filter(
        (product) =>
          product.product_name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (selectedMaterial) {
      filtered = filtered.filter((product) =>
        product.materials.some((m) => m.materialID === selectedMaterial)
      );
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter((product) => {
        const price = calculateProductPrice(product.materials);
        return price >= min && (max ? price <= max : true);
      });
    }

    if (sortOrder) {
      filtered.sort((a, b) => {
        const priceA = calculateProductPrice(a.materials);
        const priceB = calculateProductPrice(b.materials);
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    handleFilter();
  }, [query, selectedMaterial, priceRange, sortOrder, products, categoryID]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 60000);
    return () => clearTimeout(timer);
  }, [showAd]);

  const calculateProductPrice = (materials: Material[]) => {
    if (!materials || materials.length === 0) return 0;
    return Math.min(...materials.map((material) => material.price));
  };

  const toggleFavourite = (product: Product) => {
  const isFavourited = favouriteProducts.some((fav) => fav.productID === product.productID);
  if (isFavourited) {
    setFavouriteProducts(favouriteProducts.filter((fav) => fav.productID !== product.productID));
  } else {
    setFavouriteProducts([...favouriteProducts, product]);
    alert("Đã thêm sản phẩm yêu thích vào giỏ hàng");
  }
};

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 12,
        duration: 0.6,
      },
    },
  };

  const bannerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        ease: [0.43, 0.13, 0.23, 0.96], 
      },
    },
  };

  const toolsVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: 0.2,
        ease: 'easeOut',
      },
    },
  };

  const paginationVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: 0.4,
        ease: 'easeOut',
      },
    },
  };

  return (
    <Layout>
      <div id="content">
        <motion.div variants={bannerVariants} initial="hidden" animate="visible">
          <Image src="/images/banner4.png" alt="Banner 4" width={1920} height={600} className="banner-image" />
        </motion.div>

        <FilterTools
          materials={materials}
          selectedMaterial={selectedMaterial}
          setSelectedMaterial={setSelectedMaterial}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <motion.div
          className="all-products"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {query && <p>Kết quả tìm kiếm cho: "{query}"</p>}
          <p className="product-count">{filteredProducts.length} sản phẩm</p>
          <motion.div id="content-2" className={viewMode} variants={containerVariants}>
            {currentProducts.length > 0 ? (
              currentProducts.map((product, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.0, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)' }}
                >
                  <Link href={`/USER/details/${product.productID}`}>
                    <div className={`new ${viewMode}`}>
                      <span
                        className="heart-icon1"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavourite(product);
                        }}
                      >
                        <Image
                          src={
                            isClient && favouriteProducts.some((fav) => fav.productID === product.productID)
                              ? '/images/heart-filled.png'
                              : '/images/heart.png'
                          }
                          alt="heart"
                          width={23}
                          height={23}
                        />
                      </span>
                      <Image
                        src={
                          product.images.find((img) => img.is_main === 1)?.imageURL ||
                          product.images[0]?.imageURL ||
                          '/images/addImage.png'
                        }
                        alt={product.product_name || 'Hình ảnh sản phẩm'}
                        width={viewMode === 'grid' ? 250 : 150}
                        height={viewMode === 'grid' ? 250 : 150}
                      />
                      <div className="product-info">
                        <p className="product-name" style={{ textDecoration: 'none' }}>
                          {product.product_name}
                        </p>
                        <p className="product-price">
                          {calculateProductPrice(product.materials).toLocaleString('vi-VN')} ₫
                        </p>
                        {viewMode === 'list' && (
                          <p className="product-description">{product.description.slice(0, 100)}...</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.p variants={itemVariants}>
                {query
                  ? `Không tìm thấy sản phẩm nào khớp với từ khóa "${query}".`
                  : `Không có sản phẩm nào trong danh mục "${categoryName}".`}
              </motion.p>
            )}
          </motion.div>

          {totalPages > 1 && (
            <motion.div
              className="pagination"
              variants={paginationVariants}
              initial="hidden"
              animate="visible"
            >
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                  whileHover={{ scale: 1.15, backgroundColor: '#a64ca6', color: 'white' }}
                  whileTap={{ scale: 0.95 }}
                >
                  {index + 1}
                </motion.button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Sau
              </button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="img-container"
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
        >
          <Image className="img-poster" src="/images/poster.png" alt="poster" width={500} height={150} />
        </motion.div>
      </div>
    </Layout>
  );
}