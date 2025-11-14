'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ILinkList, LinkListType } from '@/types/resources/ILinkList';
import { ILink } from '@/types/resources/ILink';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast } from '@/utils/toast';
import { validateResourceForm, transformErrorPath } from '@/schemas/resourceSchema';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Trash } from 'lucide-react';

interface ValidationError {
  Path: string;
  Message: string;
}

// Safe runtime check for File (works in browser; avoids TS complaints if Value type is string)
const isFile = (v: unknown): v is File => typeof File !== 'undefined' && v instanceof File;

export default function ResourceEditPage() {
  const params = useParams();
  const router = useRouter();
  const key = params.key as string;

  // Check authorization FIRST
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/resources',
    autoRedirect: true
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    Key: '',
    Name: '',
    Header: '',
    ShortDescription: '',
    Body: '',
    LinkList: [] as ILinkList[]
  });

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    if (isAuthorized && key) {
      fetchResource();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, key]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/resources/${key}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch resource');
      }
      
      const responseData = await response.json();
      
      // Extract the actual resource data from the API response
      // API returns { success: true, data: actualResource }
      const data = responseData.data || responseData;

      const initialFormData = {
        Key: data.Key || '',
        Name: data.Name || '',
        Header: data.Header || '',
        ShortDescription: data.ShortDescription || '',
        Body: data.Body || '',
        LinkList: data.LinkList || []
      };
      
      setFormData(initialFormData);
      setOriginalData(initialFormData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load resource';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateResourceForm(formData);
    if (!validation.success) {
      const errors = validation.errors.map(err => {
        const pathString = Array.isArray(err.path) ? err.path.join('.') : err.path;
        return {
          Path: transformErrorPath(pathString),
          Message: err.message
        };
      });
      setValidationErrors(errors);
      errorToast.validation();
      return;
    }
    
    try {
      setSaving(true);
      setValidationErrors([]);
      
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add basic fields
      formDataToSend.append('Key', formData.Key);
      formDataToSend.append('Name', formData.Name);
      formDataToSend.append('Header', formData.Header);
      formDataToSend.append('ShortDescription', formData.ShortDescription);
      formDataToSend.append('Body', formData.Body);
      
      // Add LinkList as JSON string first
      formDataToSend.append('LinkList', JSON.stringify(formData.LinkList));
      
      // Add file uploads from LinkList
      formData.LinkList.forEach((linkList, listIndex) => {
        linkList.Links.forEach((item, itemIndex) => {
          if (isFile(item.Link)) {
            const fieldName = `newfile_LinkList_${listIndex}_Links_${itemIndex}`;
            formDataToSend.append(fieldName, item.Link);
          }
        });
      });
      
      const response = await authenticatedFetch(`/api/resources/${key}`, {
        method: 'PUT',
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update resource');
      }
      
      successToast.update('Resource');
      router.push('/resources');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update resource';
      errorToast.generic(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // TODO: handle cancelling action
    // setShowCancelModal(true);
    confirmCancel();
  };

  const confirmCancel = () => {
    setFormData(originalData);
    setValidationErrors([]);
    setShowCancelModal(false);
    router.push('/resources');
  };

  // LinkList Management Functions
  const addLinkList = () => {
    setFormData({
      ...formData,
      LinkList: [
        ...formData.LinkList,
        {
          Name: '',
          Type: LinkListType.LINK,
          Priority: 1,
          Links: [{ Title: '', Link: '' }]
        }
      ]
    });
  };

  const removeLinkList = (index: number) => {
    setFormData({
      ...formData,
      LinkList: formData.LinkList.filter((_, i) => i !== index)
    });
  };

  const updateLinkList = (index: number, field: keyof ILinkList, value: string | number | LinkListType) => {
    const newLinkList = [...formData.LinkList];
    newLinkList[index] = { ...newLinkList[index], [field]: value };
    setFormData({ ...formData, LinkList: newLinkList });
  };

  const addLinkItem = (listIndex: number) => {
    const newLinkList = [...formData.LinkList];
    newLinkList[listIndex].Links.push({ Title: '', Link: '' });
    setFormData({ ...formData, LinkList: newLinkList });
  };

  const removeLinkItem = (listIndex: number, itemIndex: number) => {
    const newLinkList = [...formData.LinkList];
    newLinkList[listIndex].Links = newLinkList[listIndex].Links.filter((_, i) => i !== itemIndex);
    setFormData({ ...formData, LinkList: newLinkList });
  };

  const updateLinkItem = (listIndex: number, itemIndex: number, field: keyof ILink, value: string | File) => {
    const newLinkList = [...formData.LinkList];
    newLinkList[listIndex].Links[itemIndex] = {
      ...newLinkList[listIndex].Links[itemIndex],
      [field]: value
    };
    setFormData({ ...formData, LinkList: newLinkList });
  };

  const handleFileChange = (listIndex: number, itemIndex: number, file: File | null) => {
    if (file) {
      updateLinkItem(listIndex, itemIndex, 'Link', file);
    }
  };

  // Show loading while checking authorization
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
      </div>
    );
  }

  // Don't render anything if not authorized
  if (!isAuthorized) {
    return null;
  }

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-a"></div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="heading-5 mb-4 text-brand-g">Error Loading Resource</h2>
          <p className="text-base text-brand-f mb-6">{error}</p>
          <Button variant="primary" onClick={fetchResource}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h3 className="heading-4">Edit Resource</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* All Form Fields in One Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Name <span className="text-brand-g">*</span>
              </label>
              <Input
                type="text"
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                placeholder="Name shown on the resources list page"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Header <span className="text-brand-g">*</span>
              </label>
              <Input
                type="text"
                value={formData.Header}
                onChange={(e) => setFormData({ ...formData, Header: e.target.value })}
                placeholder="Header shown on the resource page"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Short Description <span className="text-brand-g">*</span>
              </label>
              <Textarea
                value={formData.ShortDescription}
                onChange={(e) => setFormData({ ...formData, ShortDescription: e.target.value })}
                placeholder="Brief description shown on the resources list page"
                rows={3}
              />
            </div>

            {/* Body Content */}
            <div className="border-t border-brand-q pt-6">
              <RichTextEditor
                label="Body Content *"
                value={formData.Body}
                onChange={(value) => setFormData({ ...formData, Body: value })}
                placeholder="Enter the main resource content..."
                minHeight="400px"
              />
            </div>

            {/* Link Lists */}
            <div className="border-t border-brand-q pt-6">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-brand-q">
                <h2 className="heading-3">Link Lists</h2>
                <Button
                  type="button"
                  variant="primary"
                  onClick={addLinkList}
                >
                  Add Link List
                </Button>
              </div>

              {formData.LinkList.length === 0 && (
                <p className="text-gray-600 text-center py-4">No link lists added yet. Click &ldquo;Add Link List&rdquo; to create one.</p>
              )}

              <div className="space-y-6">
                {formData.LinkList.map((linkList, listIndex) => (
                  <div key={listIndex} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="heading-5">Link List #{listIndex + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLinkList(listIndex)}
                      >
                        Remove List
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Name
                        </label>
                        <Input
                          type="text"
                          value={linkList.Name}
                          onChange={(e) => updateLinkList(listIndex, 'Name', e.target.value)}
                          placeholder="List name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Type <span className="text-brand-g">*</span></label>
                        <select
                          value={linkList.Type}
                          onChange={(e) => updateLinkList(listIndex, 'Type', e.target.value as LinkListType)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-a focus:border-brand-a"
                        >
                          <option value={LinkListType.LINK}>Link</option>
                          <option value={LinkListType.CARD_LINK}>Card Link</option>
                          <option value={LinkListType.FILE_LINK}>File Link</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Priority (1-10) <span className="text-brand-g">*</span>
                        </label>
                        <Input
                          type="number"
                          value={linkList.Priority}
                          onChange={(e) => updateLinkList(listIndex, 'Priority', Number(e.target.value))}
                          min={1}
                          max={10}
                        />
                      </div>

                      {/* Link Items */}
                      <div className="border-t border-brand-q pt-4 mt-4">
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-semibold">Links</label>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => addLinkItem(listIndex)}
                          >
                            Add Link
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {linkList.Links.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex gap-2 items-start bg-white p-3 rounded border">
                              <div className="flex-1 space-y-2">
                                <Input
                                  type="text"
                                  value={item.Title}
                                  onChange={(e) => updateLinkItem(listIndex, itemIndex, 'Title', e.target.value)}
                                  placeholder="Link name/title"
                                />
                                
                                {/* Conditional fields for file-link type */}
                                {linkList.Type === 'file-link' && (
                                  <>
                                    <Input
                                      type="text"
                                      value={item.Header || ''}
                                      onChange={(e) => updateLinkItem(listIndex, itemIndex, 'Header', e.target.value)}
                                      placeholder="Title of file description"
                                    />
                                    <textarea
                                      className="w-full p-2 border rounded"
                                      rows={3}
                                      value={item.Description || ''}
                                      onChange={(e) => updateLinkItem(listIndex, itemIndex, 'Description', e.target.value)}
                                      placeholder="File description"
                                    />
                                  </>
                                )}
                                
                                {isFile(item.Link) ? (
                                  <div className="text-sm text-gray-600">
                                    File selected: {item.Link.name}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateLinkItem(listIndex, itemIndex, 'Link', '')}
                                      className="ml-2"
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Input
                                      type="text"
                                      value={typeof item.Link === 'string' ? item.Link : ''}
                                      onChange={(e) => updateLinkItem(listIndex, itemIndex, 'Link', e.target.value)}
                                      placeholder="URL or leave empty to upload file"
                                    />
                                    <Input
                                      type="file"
                                      onChange={(e) => handleFileChange(listIndex, itemIndex, e.target.files?.[0] || null)}
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.png"
                                    />
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeLinkItem(listIndex, itemIndex)}
                                className="p-2 text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ErrorDisplay ValidationErrors={validationErrors} />
          </div>
        )}

        <div className="flex gap-4 pt-6 border-t border-brand-q">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Resource'}
          </Button>
        </div>
      </form>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
        title="Close without saving?"
        message="You may lose unsaved changes."
        variant="warning"
        confirmLabel="Discard changes"
        cancelLabel="Continue Editing"
      />
    </div>
  );
}
