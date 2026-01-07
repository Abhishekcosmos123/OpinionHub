'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Category } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import SuccessModal from '@/components/SuccessModal';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/categories?${params}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setCategoryName('');
    setImageFile(null);
    setImagePreview('');
    setEditingCategory(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);
      uploadFormData.append('folder', 'opinionhub/categories'); // Specify folder for categories
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success) {
        return data.url;
      } else {
        setError(data.error || 'Failed to upload image');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let imageUrl = '';

      // Upload image if file is selected
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: categoryName.trim(),
          image: imageUrl || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Category created successfully');
        setShowSuccessModal(true);
        setShowCreateModal(false);
        resetForm();
        fetchCategories();
      } else {
        setError(data.error || 'Failed to create category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setImagePreview(category.image || '');
    setImageFile(null);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !editingCategory) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let imageUrl = editingCategory.image || '';

      // Upload new image if file is selected
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const res = await fetch(`/api/admin/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: categoryName.trim(),
          image: imageUrl || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Category updated successfully');
        setShowSuccessModal(true);
        setShowEditModal(false);
        resetForm();
        fetchCategories();
      } else {
        setError(data.error || 'Failed to update category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteCategoryId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCategoryId) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/categories/${deleteCategoryId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Category deleted successfully');
        setShowSuccessModal(true);
        fetchCategories();
      } else {
        setError(data.error || 'Failed to delete category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setLoading(false);
      setDeleteCategoryId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Categories Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
            setError('');
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Create New Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search categories..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteCategoryId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={success}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
        }}
        title="Create New Category"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              maxLength={50}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB
            </p>
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Category preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setError('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploading ? (uploading ? 'Uploading...' : 'Creating...') : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Category"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB
            </p>
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Category preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploading ? (uploading ? 'Uploading...' : 'Updating...') : 'Update'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Categories</h2>
        
        {loading && categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <p className="text-gray-600">No categories found.</p>
        ) : (
          <>
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {category.image && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="text-lg font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(category)}
                      disabled={loading}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category._id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
