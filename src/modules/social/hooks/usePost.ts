import { useState } from 'react';
import { createPost, toggleLike, PostData } from '../services/postService';
import {
  pickPostImage,
  uploadPostImage,
  moderateImage,
  approvePost,
  rejectPost,
} from '../services/moderationService';

export function usePost(userId: string) {
  const [isPosting, setIsPosting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const post = async (
    content: string,
    type: PostData['type'],
    imageUri?: string
  ): Promise<PostData | null> => {
    setIsPosting(true);
    setModerationError(null);

    try {
      let imageUrl: string | undefined;

      if (imageUri) {
        setIsUploadingImage(true);

        // Scan image with Claude Vision before uploading
        const modResult = await moderateImage(imageUri);
        if (!modResult.safe) {
          setModerationError(
            modResult.reason ?? 'This image violates our community guidelines.'
          );
          setIsUploadingImage(false);
          setIsPosting(false);
          return null;
        }

        // Upload to Supabase
        const uploaded = await uploadPostImage(imageUri, userId);
        setIsUploadingImage(false);

        if (!uploaded) {
          setModerationError('Image upload failed. Please try again.');
          setIsPosting(false);
          return null;
        }

        imageUrl = uploaded;
      }

      const newPost = await createPost(userId, content, type, imageUrl);

      // If post had image and passed moderation, approve it
      if (newPost && imageUrl) {
        await approvePost(newPost.id);
        newPost.moderation_status = 'approved';
      }

      return newPost;
    } finally {
      setIsPosting(false);
      setIsUploadingImage(false);
    }
  };

  const like = async (
    postId: string,
    isLiked: boolean
  ): Promise<boolean> => {
    return toggleLike(userId, postId, isLiked);
  };

  const selectImage = async (): Promise<string | null> => {
    return pickPostImage();
  };

  return {
    post,
    like,
    selectImage,
    isPosting,
    isUploadingImage,
    moderationError,
    clearModerationError: () => setModerationError(null),
  };
}