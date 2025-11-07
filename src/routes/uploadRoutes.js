import express from 'express';
import multer from 'multer';
import { uploadProfileImage } from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * @desc    Upload Profile Image
 * @route   POST /api/upload/profile-image
 * @access  Public (can be protected later if needed)
 */
router.post('/profile-image', (req, res) => {
  console.log('📤 Upload route hit: POST /api/upload/profile-image');
  console.log('📤 Request method:', req.method);
  console.log('📤 Request URL:', req.url);
  console.log('📤 Request headers:', req.headers['content-type']);
  
  uploadProfileImage(req, res, (err) => {
    // Handle multer errors
    if (err) {
      console.error('Multer upload error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 5MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      
      // Handle file filter errors
      if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error uploading image',
        error: err.message,
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image file.',
      });
    }

    try {
      // Return the file path relative to the uploads directory
      const filePath = `/uploads/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          filePath: filePath,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
        },
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing uploaded image',
        error: error.message,
      });
    }
  });
});

export default router;

