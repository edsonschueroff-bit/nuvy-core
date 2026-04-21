'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Upload, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    onImagesChange: (files: File[]) => void;
    maxImages?: number;
}

export default function ImageUpload({ onImagesChange, maxImages = 5 }: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles: File[]) => {
        const updatedFiles = [...files, ...newFiles].slice(0, maxImages);
        setFiles(updatedFiles);
        onImagesChange(updatedFiles);

        const newPreviews = updatedFiles.map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);
    };

    const removeImage = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);

        setFiles(updatedFiles);
        setPreviews(updatedPreviews);
        onImagesChange(updatedFiles);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    return (
        <div className="space-y-4">
            <div
                className="upload-zone"
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />

                <div className="flex flex-col items-center gap-2">
                    <div className="icon-box">
                        <Upload size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold">Clique ou arraste as fotos aqui</p>
                        <p className="text-[11px] text-text-muted">PNG, JPG ou WEBP (Max. {maxImages} fotos)</p>
                    </div>
                </div>
            </div>

            {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-fade-in">
                    {previews.map((preview, index) => (
                        <div key={index} className="preview-card group">
                            <img src={preview} alt={`Preview ${index}`} className="preview-image" />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="remove-btn"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .upload-zone {
                    border: 2px dashed rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 16px;
                    padding: 32px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .upload-zone:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--accent-primary);
                }

                .icon-box {
                    width: 48px;
                    height: 48px;
                    background: rgba(108, 92, 231, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--accent-primary);
                    margin-bottom: 8px;
                }

                .preview-card {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .preview-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .remove-btn {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(255, 107, 107, 0.9);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .preview-card:hover .remove-btn {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
