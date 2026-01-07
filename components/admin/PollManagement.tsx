'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Poll, Category } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import SuccessModal from '@/components/SuccessModal';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';

export default function PollManagement() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [deletePollId, setDeletePollId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    statement: '',
    productImage: '',
    yesButtonText: 'Yes',
    noButtonText: 'No',
    category: '',
    isTrending: false,
    isTopPoll: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories?limit=100');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        if (data.categories.length > 0 && !formData.category) {
          setFormData((prev) => ({ ...prev, category: data.categories[0]._id }));
        }
      }
    } catch (err: any) {
      // Silently fail - categories are optional
    }
  }, [formData.category]);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        sortOrder,
      });
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/polls?${params}`);
      const data = await res.json();
      if (data.success) {
        setPolls(data.polls);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const resetForm = () => {
    setFormData({
      productName: '',
      statement: '',
      productImage: '',
      yesButtonText: 'Yes',
      noButtonText: 'No',
      category: categories.length > 0 ? categories[0]._id : '',
      isTrending: false,
      isTopPoll: false,
    });
    setImageFile(null);
    setImagePreview('');
    setEditingPoll(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please select an image file (JPEG, PNG, WebP, or GIF).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      setImageFile(file);
      setError('');
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
      uploadFormData.append('folder', 'opinionhub/polls'); // Specify folder for polls
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

  const handleEdit = (poll: Poll) => {
    setEditingPoll(poll);
      setFormData({
        productName: poll.productName,
        statement: poll.statement,
        productImage: poll.productImage,
        yesButtonText: poll.yesButtonText,
        noButtonText: poll.noButtonText,
        category: typeof poll.category === 'object' ? poll.category._id : poll.category,
        isTrending: (poll as any).isTrending || false,
        isTopPoll: (poll as any).isTopPoll || false,
      });
    setImagePreview(poll.productImage);
    setShowEditModal(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let imageUrl = formData.productImage;

      // Upload new image if file is selected
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      if (!imageUrl) {
        setError('Please upload an image file.');
        setLoading(false);
        return;
      }

      const url = editingPoll ? `/api/admin/polls/${editingPoll._id}` : '/api/admin/polls';
      const method = editingPoll ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          productImage: imageUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(editingPoll ? 'Poll updated successfully' : 'Poll created successfully');
        setShowSuccessModal(true);
        resetForm();
        setShowCreateModal(false);
        setShowEditModal(false);
        fetchPolls();
      } else {
        setError(data.error || `Failed to ${editingPoll ? 'update' : 'create'} poll`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${editingPoll ? 'update' : 'create'} poll`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletePollId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePollId) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/polls/${deletePollId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Poll deleted successfully');
        setShowSuccessModal(true);
        fetchPolls();
      } else {
        setError(data.error || 'Failed to delete poll');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete poll');
    } finally {
      setLoading(false);
      setDeletePollId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Polls Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
            setError('');
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Create New Poll
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search polls..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="createdAt">Date</option>
              <option value="productName">Name</option>
              <option value="yesVotes">Yes Votes</option>
              <option value="noVotes">No Votes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePollId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Poll"
        message="Are you sure you want to delete this poll? All votes will be deleted. This action cannot be undone."
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
        title="Create New Poll"
        size="xl"
        footer={
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
              form="create-poll-form"
              disabled={loading || uploading || categories.length === 0 || !imageFile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        }
      >
        <form id="create-poll-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                required
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="e.g., iPhone 15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statement</label>
              <textarea
                value={formData.statement}
                onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                required
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="e.g., Is iPhone worth buying?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
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
                  <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yes Button Text</label>
                <input
                  type="text"
                  value={formData.yesButtonText}
                  onChange={(e) => setFormData({ ...formData, yesButtonText: e.target.value })}
                  required
                  maxLength={50}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No Button Text</label>
                <input
                  type="text"
                  value={formData.noButtonText}
                  onChange={(e) => setFormData({ ...formData, noButtonText: e.target.value })}
                  required
                  maxLength={50}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isTrending"
                  checked={formData.isTrending}
                  onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isTrending" className="ml-2 text-sm font-medium text-gray-700">
                  Mark as Trending
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isTopPoll"
                  checked={formData.isTopPoll}
                  onChange={(e) => setFormData({ ...formData, isTopPoll: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isTopPoll" className="ml-2 text-sm font-medium text-gray-700">
                  Mark as Top Poll
                </label>
              </div>
            </div>
          </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setError('');
        }}
        title="Edit Poll"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
                setError('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-poll-form"
              disabled={loading || uploading || categories.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : loading ? 'Updating...' : 'Update Poll'}
            </button>
          </div>
        }
      >
        <form id="edit-poll-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              required
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="e.g., iPhone 15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statement</label>
            <textarea
              value={formData.statement}
              onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
              required
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="e.g., Is iPhone worth buying?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB. Leave empty to keep current image.
            </p>
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yes Button Text</label>
              <input
                type="text"
                value={formData.yesButtonText}
                onChange={(e) => setFormData({ ...formData, yesButtonText: e.target.value })}
                required
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No Button Text</label>
              <input
                type="text"
                value={formData.noButtonText}
                onChange={(e) => setFormData({ ...formData, noButtonText: e.target.value })}
                required
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              {categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isTrendingEdit"
                checked={formData.isTrending}
                onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isTrendingEdit" className="ml-2 text-sm font-medium text-gray-700">
                Mark as Trending
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isTopPollEdit"
                checked={formData.isTopPoll}
                onChange={(e) => setFormData({ ...formData, isTopPoll: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isTopPollEdit" className="ml-2 text-sm font-medium text-gray-700">
                Mark as Top Poll
              </label>
            </div>
          </div>

        </form>
      </Modal>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">All Polls</h3>
        
        {loading && polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <p className="text-gray-600">No polls found.</p>
        ) : (
          <>
            <div className="space-y-6">
              {polls.map((poll) => {
                const totalVotes = poll.totalVotes || poll.yesVotes + poll.noVotes;
                const yesPercentage = poll.yesPercentage !== undefined 
                  ? poll.yesPercentage 
                  : totalVotes > 0 
                    ? ((poll.yesVotes / totalVotes) * 100).toFixed(1) 
                    : '0';
                const noPercentage = poll.noPercentage !== undefined 
                  ? poll.noPercentage 
                  : totalVotes > 0 
                    ? ((poll.noVotes / totalVotes) * 100).toFixed(1) 
                    : '0';

                return (
                  <div
                    key={poll._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative"
                  >
                    {/* Edit and Delete Icons - Top Right */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(poll)}
                        disabled={loading}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(poll._id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-6">
                      <div className="relative h-32 w-32 flex-shrink-0">
                        <Image
                          src={poll.productImage}
                          alt={poll.productName}
                          fill
                          className="object-cover rounded-lg"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 pr-16">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-xl font-bold text-gray-900">
                            {poll.productName}
                          </h4>
                          {(poll as any).isTrending && (
                            <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
                              🔥 Trending
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-4">{poll.statement}</p>
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-sm text-gray-600">
                            Category: {typeof poll.category === 'object' ? poll.category.name : 'N/A'}
                          </span>
                          <span className="text-sm text-gray-600">
                            Total Votes: {totalVotes}
                          </span>
                        </div>
                        {totalVotes > 0 && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>
                                {poll.yesButtonText}: {yesPercentage}% ({poll.yesVotes} votes)
                              </span>
                              <span>
                                {poll.noButtonText}: {noPercentage}% ({poll.noVotes} votes)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${yesPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
