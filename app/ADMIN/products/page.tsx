"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/page";
import Image from "next/image";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useToast } from "../../Component/ToastProvider"
import "bootstrap/dist/css/bootstrap.min.css";
import "./styleProducts.css";

interface Category {
  categoryID: number;
  category_name: string;
}

interface Material {
  materialID: number;
  material_name?: string;
  price?: number;
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

export default function AdminProduct() {
  const [isClient, setIsClient] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    type: "category" | "material" | null;
    id: number | null;
    x: number;
    y: number;
  }>({ type: null, id: null, x: 0, y: 0 });
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Product>({
    product_name: "",
    categoryID: 1,
    style: "",
    stock: 0,
    description: "",
    materials: [{ materialID: 1, price: 0 }],
    images: [],
  });
  const [newCategory, setNewCategory] = useState({ category_name: "" });
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newMaterial, setNewMaterial] = useState({ material_name: "" });
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const { showToast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/products`)
      .then((response) => {
        const data = response.data.data || response.data || [];
        if (Array.isArray(data)) {
          const formattedData = data.map((product: Product) => ({
            ...product,
            images: product.images.map((img: Image) => ({
              ...img,
              imageURL: img.imageURL
                ? img.imageURL.startsWith("http")
                  ? img.imageURL.replace(
                      new RegExp(`^${API_URL}/images/${API_URL}`),
                      API_URL
                    )
                  : `${API_URL}${img.imageURL}`
                : "/images/addImage.png",
            })),
          }));
          setProducts(formattedData);
        } else {
          setProducts([]);
        }
      })
      .catch((error) => {
        setProducts([]);
      });
  }, [API_URL]);

  useEffect(() => {
    axios
      .get(`${API_URL}/materials`)
      .then((response) => {
        const data = response.data.data || response.data || [];
        if (Array.isArray(data)) {
          setMaterials(data);
        } else {
          setMaterials([]);
        }
      })
      .catch((error) => {
        setMaterials([]);
      });
  }, [API_URL]);

  useEffect(() => {
    axios
      .get(`${API_URL}/categories`)
      .then((response) => setCategories(response.data.data))
      .catch((error) => {});
  }, [API_URL]);

  const handleShowDetail = (product: Product) => {
    axios
      .get(`${API_URL}/products/${product.productID}`)
      .then((response) => {
        const detailedProduct = response.data.data;
        const formattedProduct = {
          ...detailedProduct,
          images: detailedProduct.images
            ? detailedProduct.images.map((img: Image) => ({
                ...img,
                imageURL: img.imageURL
                  ? img.imageURL.startsWith("http")
                    ? img.imageURL
                    : `${API_URL}${img.imageURL}`
                  : "/images/default.png",
                is_main: img.is_main || 0,
              }))
            : [],
          materials: detailedProduct.materials || [],
        };
        setCurrentProduct(formattedProduct);
        setNewProduct(formattedProduct);
        setImageFiles([]);
        const mainIndex = formattedProduct.images.findIndex(
          (img: Image) => img.is_main === 1
        );
        setMainImageIndex(mainIndex >= 0 ? mainIndex : 0);
        setShowModal(true);
      })
      .catch((error) => {
        showToast("Lỗi khi lấy chi tiết sản phẩm!", "error");
      });
  };

  const handleShowAddProduct = () => {
    const defaultCategoryID = selectedCategory || categories[0]?.categoryID || 1;
    setNewProduct({
      product_name: "",
      categoryID: defaultCategoryID,
      style: "",
      stock: 0,
      description: "",
      materials: [{ materialID: 1, price: 0 }],
      images: [],
    });
    setImageFiles([]);
    setMainImageIndex(0);
    setCurrentProduct(null);
    setShowModal(true);
  };

  const handleShowAddCategory = () => {
    setNewCategory({ category_name: "" });
    setShowCategoryModal(true);
  };

  const handleShowEditCategory = (category: Category) => {
    setEditCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleShowAddMaterial = () => {
    setNewMaterial({ material_name: "" });
    setShowMaterialModal(true);
  };

  const handleShowEditMaterial = (material: Material) => {
    setEditMaterial(material);
    setShowEditMaterialModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: name === "categoryID" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleMaterialChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setNewProduct((prev) => {
      const updatedMaterials = prev.materials.map((mat, i) =>
        i === index
          ? {
              ...mat,
              [field]:
                field === "price" ? parseFloat(value as string) : Number(value),
            }
          : mat
      );
      return { ...prev, materials: updatedMaterials };
    });
  };

  const handleAddMaterial = () => {
    setNewProduct((prev) => ({
      ...prev,
      materials: [...prev.materials, { materialID: 1, price: 0 }],
    }));
  };

  const handleRemoveMaterial = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);
      setMainImageIndex(0);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (currentProduct) {
      setNewProduct((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
      setMainImageIndex((prevIndex) => {
        const totalImages = newProduct.images.length - 1;
        if (prevIndex >= totalImages) {
          return totalImages > 0 ? totalImages - 1 : 0;
        }
        return prevIndex;
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleAddProduct = () => {
    if (
      !newProduct.product_name ||
      !newProduct.categoryID ||
      !newProduct.style ||
      newProduct.stock === undefined ||
      !newProduct.description
    ) {
      showToast("Vui lòng nhập đầy đủ thông tin sản phẩm!", "error");
      return;
    }

    if (!Array.isArray(newProduct.materials) || newProduct.materials.length === 0) {
      showToast("Vui lòng thêm ít nhất một chất liệu!", "error");
      return;
    }

    if (!categories.some((cat) => cat.categoryID === newProduct.categoryID)) {
      showToast("Danh mục không hợp lệ!", "error");
      return;
    }

    if (
      !newProduct.materials.every((mat) =>
        materials.some((m) => m.materialID === mat.materialID)
      )
    ) {
      showToast("Chất liệu không hợp lệ!", "error");
      return;
    }

    const formData = new FormData();
    formData.append("product_name", newProduct.product_name);
    formData.append("categoryID", newProduct.categoryID.toString());
    formData.append("style", newProduct.style);
    formData.append("stock", newProduct.stock.toString());
    formData.append("description", newProduct.description);
    formData.append("materials", JSON.stringify(newProduct.materials));
    imageFiles.forEach((file, index) => {
      formData.append("images", file);
    });
    if (imageFiles.length > 0) {
      formData.append("mainImageIndex", mainImageIndex.toString());
    }

    axios
      .post(`${API_URL}/products`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        const addedProduct = response.data.data;
        const newImages = addedProduct.images.map((img: Image) => ({
          ...img,
          imageURL: img.imageURL
            ? img.imageURL.startsWith("http")
              ? img.imageURL
              : `${API_URL}${img.imageURL}`
            : "/images/default.png",
        }));
        setProducts((prev) => [
          ...prev,
          { ...newProduct, productID: addedProduct.productID, images: newImages },
        ]);
        handleCloseModal();
        showToast("Thêm sản phẩm thành công!", "success");
      })
      .catch((error) => {
        showToast("Lỗi khi thêm sản phẩm!", "error");
      });
  };

  const handleUpdateProduct = () => {
    if (!currentProduct || !currentProduct.productID) {
      showToast("Không tìm thấy sản phẩm để cập nhật!", "error");
      return;
    }
    if (!newProduct.product_name) {
      showToast("Vui lòng nhập tên sản phẩm!", "error");
      return;
    }
    const formData = new FormData();
    formData.append("productID", currentProduct.productID);
    formData.append("product_name", newProduct.product_name);
    formData.append("categoryID", newProduct.categoryID.toString());
    formData.append("style", newProduct.style || "");
    formData.append("stock", newProduct.stock.toString());
    formData.append("description", newProduct.description || "");
    formData.append("materials", JSON.stringify(newProduct.materials));

    const normalizedImages = newProduct.images.map((img) => ({
      ...img,
      imageURL: img.imageURL.replace(new RegExp(`^${API_URL}`), ""),
    }));
    formData.append("existingImages", JSON.stringify(normalizedImages));
    imageFiles.forEach((file, index) => {
      formData.append("images", file);
    });

    if (newProduct.images.length > 0 || imageFiles.length > 0) {
      const totalImages = newProduct.images.length + imageFiles.length;
      const validMainIndex = Math.min(mainImageIndex, totalImages - 1);
      formData.append(
        "mainImageIndex",
        validMainIndex >= 0 ? validMainIndex.toString() : "0"
      );
    }

    axios
      .put(`${API_URL}/products/${currentProduct.productID}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        const updatedProduct = response.data.data;
        const formattedUpdatedProduct = {
          ...updatedProduct,
          images: updatedProduct.images
            ? updatedProduct.images.map((img: Image) => ({
                ...img,
                imageURL: img.imageURL
                  ? img.imageURL.startsWith("http")
                    ? img.imageURL.replace(
                        new RegExp(`^${API_URL}/images/${API_URL}`),
                        API_URL
                      )
                    : `${API_URL}${img.imageURL}`
                  : "/images/default.png",
                is_main: img.is_main || 0,
              }))
            : [],
          materials: updatedProduct.materials || [],
        };
        setProducts((prev) =>
          prev.map((p) =>
            p.productID === updatedProduct.productID ? formattedUpdatedProduct : p
          )
        );
        setNewProduct(formattedUpdatedProduct);
        setImageFiles([]);
        const newMainIndex = formattedUpdatedProduct.images.findIndex(
          (img: Image) => img.is_main === 1
        );
        setMainImageIndex(newMainIndex >= 0 ? newMainIndex : 0);
        handleCloseModal();
        showToast("Cập nhật sản phẩm thành công!", "success");
      })
      .catch((error) => {
        showToast(
          "Lỗi khi cập nhật sản phẩm: " +
            (error.response?.data?.message || error.message),
          "error"
        );
      });
  };

  const handleAddCategory = () => {
    if (!newCategory.category_name) {
      showToast("Vui lòng nhập tên danh mục!", "error");
      return;
    }

    axios
      .post(`${API_URL}/categories/add`, newCategory)
      .then((response) => {
        if (response.data.success) {
          setCategories((prev) => [...prev, response.data.data]);
          setShowCategoryModal(false);
          showToast("Thêm danh mục thành công!", "success");
        } else {
          showToast("Thêm danh mục thất bại: " + response.data.message, "error");
        }
      })
      .catch((error) => {
        showToast("Lỗi khi thêm danh mục!", "error");
      });
  };

  const handleEditCategory = () => {
    if (!editCategory || !editCategory.categoryID || !editCategory.category_name) {
      showToast("Vui lòng nhập đầy đủ thông tin danh mục!", "error");
      return;
    }

    axios
      .put(`${API_URL}/categories`, {
        categoryID: editCategory.categoryID,
        category_name: editCategory.category_name,
      })
      .then((response) => {
        if (response.data.success) {
          setCategories((prev) =>
            prev.map((cat) =>
              cat.categoryID === editCategory.categoryID ? editCategory : cat
            )
          );
          setShowEditCategoryModal(false);
          showToast("Cập nhật danh mục thành công!", "success");
        } else {
          showToast("Cập nhật danh mục thất bại: " + response.data.message, "error");
        }
      })
      .catch((error) => {
        showToast("Lỗi khi cập nhật danh mục!", "error");
      });
  };

  const handleDeleteCategory = (categoryID: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

    axios
      .delete(`${API_URL}/categories`, { data: { categoryID } })
      .then((response) => {
        if (response.data.success) {
          setCategories((prev) =>
            prev.filter((cat) => cat.categoryID !== categoryID)
          );
          showToast("Xóa danh mục thành công!", "success");
        } else {
          showToast("Xóa danh mục thất bại: " + response.data.message, "error");
        }
      })
      .catch((error) => {
        showToast("Lỗi khi xóa danh mục!", "error");
      });
  };

  const handleAddNewMaterial = () => {
    if (!newMaterial.material_name) {
      showToast("Vui lòng nhập đầy đủ tên chất liệu!", "error");
      return;
    }

    axios
      .post(`${API_URL}/materials/add`, {
        material_name: newMaterial.material_name,
      })
      .then((response) => {
        if (response.data.success) {
          setMaterials((prev) => [...prev, response.data.data]);
          setShowMaterialModal(false);
          showToast("Thêm chất liệu thành công!", "success");
        } else {
          showToast("Thêm chất liệu thất bại: " + response.data.message, "error");
        }
      })
      .catch((error) => {
        showToast("Lỗi khi thêm chất liệu!", "error");
      });
  };

  const handleEditMaterial = () => {
    if (!editMaterial || !editMaterial.materialID || !editMaterial.material_name) {
      showToast("Vui lòng nhập đầy đủ thông tin chất liệu!", "error");
      return;
    }

    axios
      .put(`${API_URL}/materials`, {
        materialID: editMaterial.materialID,
        material_name: editMaterial.material_name,
      })
      .then((response) => {
        if (response.data.success) {
          setMaterials((prev) =>
            prev.map((mat) =>
              mat.materialID === editMaterial.materialID ? editMaterial : mat
            )
          );
          setShowEditMaterialModal(false);
          showToast("Cập nhật chất liệu thành công!", "success");
        } else {
          showToast("Cập nhật chất liệu thất bại: " + response.data.message, "error");
        }
      })
      .catch((error) => {
        showToast("Lỗi khi cập nhật chất liệu!", "error");
      });
  };

  const handleDeleteMaterial = (materialID: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chất liệu này?")) return;

    axios
      .delete(`${API_URL}/materials`, { data: { materialID } })
      .then((response) => {
        if (response.data.success) {
          setMaterials((prev) =>
            prev.filter((mat) => mat.materialID !== materialID)
          );
          showToast("Xóa chất liệu thành công!", "success");
        } else {
          showToast("Xóa chất liệu thất bại: " + response.data.message, "error");
        }
      })
      .catch((error) => {
        showToast("Lỗi khi xóa chất liệu!", "error");
      });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentProduct(null);
    setImageFiles([]);
  };

  const handleSelectProduct = (productID: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productID)
        ? prev.filter((id) => id !== productID)
        : [...prev, productID]
    );
  };

  const handleDeleteProducts = () => {
    if (selectedProducts.length === 0) {
      showToast("Vui lòng chọn ít nhất một sản phẩm để xóa!", "error");
      return;
    }

    if (
      confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm?`)
    ) {
      axios
        .delete(`${API_URL}/products`, {
          data: { productID: selectedProducts },
        })
        .then((response) => {
          if (response.data.success) {
            setProducts((prev) =>
              prev.filter((product) => !selectedProducts.includes(product.productID!))
            );
            setSelectedProducts([]);
            showToast("Xóa sản phẩm thành công!", "success");
          } else {
            showToast("Xóa sản phẩm thất bại: " + response.data.message, "error");
          }
        })
        .catch((error) => {
          showToast("Lỗi khi xóa sản phẩm!", "error");
        });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      (product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.productID &&
          product.productID.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (selectedCategory ? product.categoryID === selectedCategory : true) &&
      (selectedMaterial
        ? product.materials.some((mat) => mat.materialID === selectedMaterial)
        : true)
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  if (!isClient) {
    return null;
  }

  return (
    <Layout>
      <Row>
        <Col md={2} className="sidebar">
          <div className="product-count">
            <p>
              Hiển thị {currentProducts.length} / {filteredProducts.length} sản phẩm
            </p>
          </div>
          <h5>Danh mục sản phẩm</h5>
          <ul className="category-list">
            <li
              className={selectedCategory === null ? "active" : ""}
              onClick={() => setSelectedCategory(null)}
            >
              Tất cả danh mục
            </li>
            {categories.map((category) => (
              <li
                key={category.categoryID}
                className={`category-item ${
                  selectedCategory === category.categoryID ? "active" : ""
                }`}
                style={{ display: "flex", alignItems: "center" }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    type: "category",
                    id: category.categoryID,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const timer = setTimeout(() => {
                    setContextMenu({
                      type: "category",
                      id: category.categoryID,
                      x: touch.clientX,
                      y: touch.clientY,
                    });
                  }, 500);
                  e.currentTarget.addEventListener(
                    "touchend",
                    () => clearTimeout(timer),
                    { once: true }
                  );
                }}
              >
                <span
                  className="category-name"
                  onClick={() => setSelectedCategory(category.categoryID)}
                >
                  {category.category_name}
                </span>
                <span
                  className="edit-icon"
                  onClick={() => handleShowEditCategory(category)}
                  title="Chỉnh sửa danh mục"
                >
                  <Image
                    src="/images/pointer.png"
                    alt="pointer"
                    width={15}
                    height={15}
                  />
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="outline-primary"
            size="sm"
            className="btn-outline-success"
            onClick={handleShowAddCategory}
          >
            Thêm danh mục
          </Button>

          <h5 className="mt-4">Chất liệu</h5>
          <ul className="category-list">
            <li
              className={selectedMaterial === null ? "active" : ""}
              onClick={() => setSelectedMaterial(null)}
            >
              Tất cả chất liệu
            </li>
            {materials.map((material) => (
              <li
                key={material.materialID}
                className={`material-item ${
                  selectedMaterial === material.materialID ? "active" : ""
                }`}
                style={{ display: "flex", alignItems: "center" }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    type: "material",
                    id: material.materialID,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const timer = setTimeout(() => {
                    setContextMenu({
                      type: "material",
                      id: material.materialID,
                      x: touch.clientX,
                      y: touch.clientY,
                    });
                  }, 500);
                  e.currentTarget.addEventListener(
                    "touchend",
                    () => clearTimeout(timer),
                    { once: true }
                  );
                }}
              >
                <span
                  className="material-name"
                  onClick={() => setSelectedMaterial(material.materialID)}
                >
                  {material.material_name}
                </span>
                <span
                  className="edit-icon"
                  onClick={() => handleShowEditMaterial(material)}
                  title="Chỉnh sửa chất liệu"
                >
                  <Image
                    src="/images/pointer.png"
                    alt="pointer"
                    width={15}
                    height={15}
                  />
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="outline-primary"
            size="sm"
            className="btn-outline-success"
            onClick={handleShowAddMaterial}
          >
            Thêm chất liệu
          </Button>

          {contextMenu.type && (
            <div
              className="context-menu"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={() => setContextMenu({ type: null, id: null, x: 0, y: 0 })}
            >
              <div
                className="context-menu-item"
                onClick={() => {
                  if (contextMenu.type === "category") {
                    const category = categories.find(
                      (c) => c.categoryID === contextMenu.id
                    );
                    if (category) handleShowEditCategory(category);
                  } else if (contextMenu.type === "material") {
                    const material = materials.find(
                      (m) => m.materialID === contextMenu.id
                    );
                    if (material) handleShowEditMaterial(material);
                  }
                }}
              >
                Sửa
              </div>
              <div
                className="context-menu-item"
                onClick={() => {
                  if (contextMenu.type === "category" && contextMenu.id) {
                    handleDeleteCategory(contextMenu.id);
                  } else if (contextMenu.type === "material" && contextMenu.id) {
                    handleDeleteMaterial(contextMenu.id);
                  }
                }}
              >
                Xóa
              </div>
            </div>
          )}
        </Col>
        <Col md={10}>
          <div id="product">
            <div id="search">
              <Button variant="transparent" onClick={handleShowAddProduct}>
                <Image
                  src="/images/addProduct.png"
                  alt="addProduct"
                  width={25}
                  height={25}
                />
              </Button>
              <div className="search-box">
                <Image
                  src="/images/search.png"
                  alt="search"
                  width={18}
                  height={18}
                  className="search-icon"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteProducts}
                disabled={selectedProducts.length === 0}
              >
                Xóa sản phẩm
              </Button>
            </div>

            <div className="product-grid">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => {
                  const mainImage =
                    product.images.find((img) => img.is_main === 1) ||
                    product.images[0];
                  return (
                    <div key={product.productID} className="product-card">
                      {mainImage ? (
                        <Image
                          src={mainImage.imageURL}
                          alt={product.product_name || "Hình ảnh sản phẩm"}
                          width={200}
                          height={190}
                          className="product-image"
                          onClick={() => handleShowDetail(product)}
                        />
                      ) : (
                        <div className="no-image">Không có ảnh</div>
                      )}
                      <h6>{product.product_name}</h6>
                      <p>{product.style}</p>
                      <div className="check">
                        <Button
                          variant="transparent"
                          size="sm"
                          onClick={() => handleShowDetail(product)}
                        >
                          <Image
                            src="/images/edit.png"
                            alt="edit"
                            width={20}
                            height={20}
                          />
                        </Button>
                        <Form.Check
                          type="checkbox"
                          className="product-checkbox"
                          checked={selectedProducts.includes(product.productID!)}
                          onChange={() => handleSelectProduct(product.productID!)}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>
                  {searchTerm ? "Không tìm thấy sản phẩm" : "Không có dữ liệu"}
                </p>
              )}
            </div>

            <div className="totalPages">
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-2">
                  <Pagination className="custom-pagination">
                    <Pagination.Prev
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    />
                    {paginationItems}
                    <Pagination.Next
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Tên sản phẩm</Form.Label>
                  <Form.Control
                    type="text"
                    name="product_name"
                    value={newProduct.product_name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên sản phẩm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Danh mục</Form.Label>
                  <Form.Select
                    name="categoryID"
                    value={newProduct.categoryID}
                    onChange={handleInputChange}
                  >
                    {categories.map((category) => (
                      <option
                        key={category.categoryID}
                        value={category.categoryID}
                      >
                        {category.category_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Kiểu dáng</Form.Label>
                  <Form.Control
                    type="text"
                    name="style"
                    value={newProduct.style}
                    onChange={handleInputChange}
                    placeholder="Nhập kiểu dáng"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Số lượng</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleInputChange}
                    placeholder="Nhập số lượng"
                    min="0"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    rows={3}
                    value={newProduct.description}
                    onChange={handleInputChange}
                    placeholder="Nhập mô tả sản phẩm"
                  />
                </Form.Group>
              </Form>
            </Col>
            <Col md={6}>
              <h6>Chất liệu</h6>
              {newProduct.materials.map((mat, index) => (
                <Row key={index} className="mb-2">
                  <Col md={5}>
                    <Form.Select
                      value={mat.materialID}
                      onChange={(e) =>
                        handleMaterialChange(index, "materialID", e.target.value)
                      }
                    >
                      {materials.map((material) => (
                        <option
                          key={material.materialID}
                          value={material.materialID}
                        >
                          {material.material_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={5}>
                    <Form.Control
                      type="number"
                      value={mat.price || 0}
                      onChange={(e) =>
                        handleMaterialChange(index, "price", e.target.value)
                      }
                      placeholder="Nhập giá (VND)"
                    />
                    <small>{mat.price ? formatPrice(mat.price) : "0 ₫"}</small>
                  </Col>
                  <Col md={2}>
                    <Button
                      variant="transparent"
                      size="sm"
                      onClick={() => handleRemoveMaterial(index)}
                    >
                      ❌️
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleAddMaterial}
              >
                Thêm chất liệu
              </Button>

              <Form.Group className="mt-3">
                <Form.Label>Ảnh sản phẩm</Form.Label>
                <div className="image-list">
                  {newProduct.images.map((image, index) => (
                    <div key={index} className="image-item">
                      <Image
                        src={image.imageURL}
                        alt={`Ảnh ${index + 1}`}
                        width={80}
                        height={80}
                        className="product-image"
                      />
                      <Button
                        variant="transparent"
                        size="sm"
                        onClick={() => handleRemoveImage(index)}
                      >
                        ❌️
                      </Button>
                      <Form.Check
                        type="radio"
                        label="Ảnh chính"
                        name="mainImage"
                        checked={index === mainImageIndex}
                        onChange={() => setMainImageIndex(index)}
                      />
                    </div>
                  ))}
                </div>
                <Form.Control
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  accept="image/*"
                />
                {imageFiles.length > 0 && (
                  <div className="image-preview">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="image-item">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          width={80}
                          height={80}
                        />
                        <Form.Check
                          type="radio"
                          label="Ảnh chính"
                          name="mainImage"
                          checked={mainImageIndex === index}
                          onChange={() => setMainImageIndex(index)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          {currentProduct ? (
            <Button variant="primary" onClick={handleUpdateProduct}>
              Cập nhật sản phẩm
            </Button>
          ) : (
            <Button variant="success" onClick={handleAddProduct}>
              Thêm sản phẩm
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        show={showCategoryModal}
        onHide={() => setShowCategoryModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thêm danh mục mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Tên danh mục</Form.Label>
              <Form.Control
                type="text"
                value={newCategory.category_name}
                onChange={(e) =>
                  setNewCategory({ category_name: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCategoryModal(false)}
          >
            Đóng
          </Button>
          <Button variant="success" onClick={handleAddCategory}>
            Thêm danh mục
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showEditCategoryModal}
        onHide={() => setShowEditCategoryModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa danh mục</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Tên danh mục</Form.Label>
              <Form.Control
                type="text"
                value={editCategory?.category_name || ""}
                onChange={(e) =>
                  setEditCategory((prev) => ({
                    ...prev!,
                    category_name: e.target.value,
                  }))
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditCategoryModal(false)}
          >
            Đóng
          </Button>
          <Button variant="primary" onClick={handleEditCategory}>
            Cập nhật danh mục
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showMaterialModal}
        onHide={() => setShowMaterialModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thêm chất liệu mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Tên chất liệu</Form.Label>
              <Form.Control
                type="text"
                value={newMaterial.material_name}
                onChange={(e) =>
                  setNewMaterial({ material_name: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMaterialModal(false)}
          >
            Đóng
          </Button>
          <Button variant="success" onClick={handleAddNewMaterial}>
            Thêm chất liệu
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showEditMaterialModal}
        onHide={() => setShowEditMaterialModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa chất liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Tên chất liệu</Form.Label>
              <Form.Control
                type="text"
                value={editMaterial?.material_name || ""}
                onChange={(e) =>
                  setEditMaterial((prev) => ({
                    ...prev!,
                    material_name: e.target.value,
                  }))
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditMaterialModal(false)}
          >
            Đóng
          </Button>
          <Button variant="primary" onClick={handleEditMaterial}>
            Cập nhật chất liệu
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}